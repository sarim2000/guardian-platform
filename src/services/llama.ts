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

Settings.embedModel = new OpenAIEmbedding({
  apiKey: env.OPENAI_API_KEY,
  model: "text-embedding-3-large",
  dimensions: 1536,
});

Settings.llm = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
});

export class LlamaService {
  private static instances: Map<string, LlamaService> = new Map();
  private organizationName: string;
  private pipeline: IngestionPipeline;

  private constructor(organizationName: string) {
    this.organizationName = organizationName;

    // Initialize ingestion pipeline with transformations including embeddings
    this.pipeline = new IngestionPipeline({
      transformations: [
        new SentenceSplitter({ chunkSize: 1024, chunkOverlap: 20 }),
      ],
      vectorStore: new PGVectorStore({
        client: {
          db: {
            connectionString: env.DATABASE_URL,
          }
        },
        tableName: "documents",
        dimensions: 1536,
        shouldConnect: true,
        embedModel: new OpenAIEmbedding({
          apiKey: env.OPENAI_API_KEY,
          model: "text-embedding-3-large",
        }),
        embeddingModel: new OpenAIEmbedding({
          apiKey: env.OPENAI_API_KEY,
          model: "text-embedding-3-large",
        }),
      }),
    });
  }

  public static getInstance(organizationName: string): LlamaService {
    if (!LlamaService.instances.has(organizationName)) {
      LlamaService.instances.set(organizationName, new LlamaService(organizationName));
    }
    return LlamaService.instances.get(organizationName)!;
  }

  /**
   * Ingests README content using the pipeline
   */
  async ingestReadme(repoName: string, readmeContent: string): Promise<void> {
    try {
      console.info(`Starting ingestion for ${repoName}`);

      // Create document with metadata
      const document = new Document({
        text: readmeContent,
        id_: `${this.organizationName}/${repoName}/README.md`,
        metadata: {
          serviceName: repoName,
          organizationName: this.organizationName,
          repositoryName: repoName
        }
      });

      const connectionString = env.DATABASE_URL;

      const pgvs = new PGVectorStore({ clientConfig: { connectionString } });


      const storageContext = await storageContextFromDefaults({ vectorStore: pgvs });



      const index = await VectorStoreIndex.fromVectorStore(pgvs);

      const retriever = index.asRetriever({
        similarityTopK: 1,
      });
      const results = await retriever.retrieve({
        query: document.text,
      });

      // skip if score is > 0.95
      if (results[0]?.score && results[0].score > 0.95) {
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
   * Creates a chat engine for querying the ingested documents
   */
  async createChatEngine(repoName: string, organizationName: string, serviceName: string) {
    try {
      const pgvs = new PGVectorStore({ clientConfig: { connectionString: env.DATABASE_URL } });


      const storageContext = await storageContextFromDefaults({ vectorStore: pgvs });


      const index = await VectorStoreIndex.fromVectorStore(pgvs);


      const retriever = index.asRetriever({
        similarityTopK: 5,
        filters: {
          filters: [
            {
              key: "serviceName",
              operator: FilterOperator.EQ,
              value: repoName,
            },
            {
              key: "organizationName",
              operator: FilterOperator.EQ,
              value: organizationName,
            },
          ]
        }
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



