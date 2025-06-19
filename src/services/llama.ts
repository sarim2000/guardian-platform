import {
  Document,
  IngestionPipeline,
  SentenceSplitter,
  Settings,
  storageContextFromDefaults,
  TitleExtractor,
  VectorStoreIndex,
} from "llamaindex";
import { db } from '@/db';
import env from '@/utils/env';
import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";
import { PGVectorStore } from "@llamaindex/postgres";
import {FilterOperator, MetadataFilter} from "@llamaindex/core/vector-store"

// Global flag to ensure Settings are only initialized once
let settingsInitialized = false;

function initializeSettings() {
  if (settingsInitialized) {
    return;
  }

  Settings.embedModel = new OpenAIEmbedding({
    apiKey: env.EMBEDDING_API_KEY,
    model: env.EMBEDDING_MODEL,
    baseURL: env.EMBEDDING_MODEL_BASE_URL,
    dimensions: 1536,
  });

  Settings.llm = new OpenAI({
    apiKey: env.LLM_API_KEY,
    model: env.LLM_MODEL,
    baseURL: env.LLM_BASE_URL,
  });

  settingsInitialized = true;
  console.info('LlamaIndex Settings initialized');
}

export class LlamaService {
  private static instances: Map<string, LlamaService> = new Map();
  private organizationName: string;
  private pipeline: IngestionPipeline;
  private vectorStore: PGVectorStore | null = null;

  private constructor(organizationName: string) {
    // Initialize settings only once
    initializeSettings();
    
    this.organizationName = organizationName;

    // Initialize vector store once and reuse
    this.vectorStore = new PGVectorStore({
      clientConfig: { 
        connectionString: env.DATABASE_URL 
      },
      dimensions: 1536,
    });

    // Initialize ingestion pipeline with transformations including embeddings
    this.pipeline = new IngestionPipeline({
      transformations: [
        new SentenceSplitter({ chunkSize: 1024, chunkOverlap: 20 }),
      ],
      vectorStore: this.vectorStore,
    });
  }

  public static getInstance(organizationName: string): LlamaService {
    if (!LlamaService.instances.has(organizationName)) {
      LlamaService.instances.set(organizationName, new LlamaService(organizationName));
    }
    return LlamaService.instances.get(organizationName)!;
  }

  /**
   * Get the reusable vector store instance
   */
  private getVectorStore(): PGVectorStore {
    if (!this.vectorStore) {
      this.vectorStore = new PGVectorStore({
        clientConfig: { 
          connectionString: env.DATABASE_URL 
        },
        tableName: "documents",
        dimensions: 1536,
      });
    }
    return this.vectorStore;
  }

  /**
   * Ingests README content using the pipeline
   */
  async ingestReadme(repoName: string, serviceName: string, readmeContent: string): Promise<void> {
    try {
      console.info(`Starting ingestion for ${repoName}`);

      // Create document with metadata
      const document = new Document({
        text: readmeContent,
        id_: `${this.organizationName}/${repoName}/README.md`,
        metadata: {
          serviceName: serviceName,
          organizationName: this.organizationName,
          repositoryName: repoName
        }
      });

      const pgvs = this.getVectorStore();
      const storageContext = await storageContextFromDefaults({ vectorStore: pgvs });
      const index = await VectorStoreIndex.fromVectorStore(pgvs);

      const retriever = index.asRetriever({
        similarityTopK: 1,
      });
      const results = await retriever.retrieve({
        query: document.text,
      });


      // skip if score is > 0.80
      if (results[0]?.score && results[0].score > 0.80) {
        console.info(`README for ${repoName} has already been ingested. Skipping ingestion.`);
        return;
      }

      const ingestedIndex = await VectorStoreIndex.fromDocuments([document], storageContext);

    } catch (error) {
      console.error(`Error ingesting README for ${repoName}:`, error);
      throw error;
    }
  }

  /**
   * Ingests docs content using the pipeline (fire and forget)
   */
  async ingestDocs(repoName: string, serviceName: string, docsContent: { [filePath: string]: string }): Promise<void> {
    try {
      console.info(`Starting docs ingestion for ${repoName} with ${Object.keys(docsContent).length} files`);

      if (Object.keys(docsContent).length === 0) {
        console.info(`No docs content to ingest for ${repoName}`);
        return;
      }

      const pgvs = this.getVectorStore();
      const storageContext = await storageContextFromDefaults({ vectorStore: pgvs });
      const index = await VectorStoreIndex.fromVectorStore(pgvs);

      const documents: Document[] = [];

      // Create documents for each file
      for (const [filePath, content] of Object.entries(docsContent)) {
        const document = new Document({
          text: content,
          id_: `${this.organizationName}/${repoName}/${filePath}`,
          metadata: {
            serviceName: serviceName,
            organizationName: this.organizationName,
            repositoryName: repoName,
            filePath: filePath,
            documentType: 'docs'
          }
        });

        // Check if similar content already exists
        const retriever = index.asRetriever({
          similarityTopK: 1,
        });
        const results = await retriever.retrieve({
          query: content.substring(0, 500), // Use first 500 chars for similarity check
        });

        // Skip if score is > 0.80 (very similar content already exists)
        if (results[0]?.score && results[0].score > 0.80) {
          console.info(`Docs file ${filePath} for ${repoName} appears to already be ingested. Skipping.`);
          continue;
        }

        documents.push(document);
      }

      if (documents.length > 0) {
        console.info(`Ingesting ${documents.length} docs files for ${repoName}`);
        await VectorStoreIndex.fromDocuments(documents, storageContext);
        console.info(`Successfully ingested ${documents.length} docs files for ${repoName}`);
      } else {
        console.info(`All docs files for ${repoName} were already ingested`);
      }

    } catch (error) {
      console.error(`Error ingesting docs for ${repoName}:`, error);
      // Don't throw error since this is fire-and-forget
    }
  }

  /**
   * Creates a chat engine for querying the ingested documents
   */
  async createChatEngine(repoName: string, organizationName: string, serviceName: string) {
    try {
      console.log('creating chat engine for', repoName, organizationName, serviceName);
      const pgvs = this.getVectorStore();
      const storageContext = await storageContextFromDefaults({ vectorStore: pgvs });
      const index = await VectorStoreIndex.fromVectorStore(pgvs);


      const retriever = index.asRetriever({
        similarityTopK: 5,
        filters: {
          filters: [
            {
              key: "serviceName",
              operator: FilterOperator.EQ,
              value: serviceName,
            },
            {
              key: "repositoryName",
              operator: FilterOperator.EQ,
              value: repoName,
            },
          ]
        },
      });
      
      const chatEngine = index.asChatEngine({
        retriever: retriever,

      });

      return chatEngine;
    } catch (error) {
      console.error('Error creating chat engine:', error);
      throw error;
    }
  }
}



