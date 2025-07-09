import { NextResponse } from 'next/server';
import { LlamaService } from '@/services/llama';

export async function POST(request: Request) {
  try {
    const { message, messages = [], repoName, organizationName, serviceName } = await request.json();

    // Validate that all required fields are present
    if (!message || !repoName || !organizationName || !serviceName) {
      const missingFields = [];
      if (!message) missingFields.push('message');
      if (!repoName) missingFields.push('repoName');
      if (!organizationName) missingFields.push('organizationName');
      if (!serviceName) missingFields.push('serviceName');
      
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Additional validation for message type and content
    if (typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message must be a non-empty string');
    }
    
    // Validate repository and organization names format
    const namePattern = /^[a-zA-Z0-9-_.]+$/;
    if (!namePattern.test(repoName)) {
      throw new Error('Invalid repository name format');
    }
    if (!namePattern.test(organizationName)) {
      throw new Error('Invalid organization name format');
    }
    if (!namePattern.test(serviceName)) {
      throw new Error('Invalid service name format');
    }

    const systemPrompt = `
      You are a knowledgeable assistant specialized in answering questions about service documentation.
      Your responses should be:
      1. Accurate and directly based on the documentation
      2. Well-structured using semantic HTML
      3. Easy to read and understand
      4. Use mantine components for styling.

      Format requirements:
      - Use semantic HTML tags appropriately (<h1> for main headings, <h2> for subheadings, <p> for paragraphs, etc.)
      - For code blocks, wrap them in <pre><code>code here</code></pre> or <pre><code class="language-javascript">code here</code></pre> for syntax highlighting
      - For inline code, use <code>code here</code> tags
      - For lists, use <ul>/<ol> with <li> items
      - For emphasis, use <strong> or <em> tags
      - Tables should use proper <table>, <tr>, <td> structure
      - Use mantine components for styling.
      - No new line characters.
      
      Important:
      - Provide only valid HTML content
      - Do not use newline characters or extra whitespace
      - Keep responses concise but complete
      - Include relevant code examples when appropriate
      - If you're unsure about something, acknowledge the uncertainty
    `;

    // Build conversation history with system prompt
    const conversationHistory = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: "user",
        content: message,
      }
    ];

    const encoder = new TextEncoder();

    // Create a streaming response with proper error handling
    const customReadable = new ReadableStream({
      async start(controller) {
        let llamaService: LlamaService | null = null;
        let chatEngine: any = null;

        try {
          console.log('creating chat engine for', repoName, organizationName, serviceName);
          llamaService = LlamaService.getInstance(organizationName);
          chatEngine = await llamaService.createChatEngine(repoName, organizationName, serviceName);

          const response = await chatEngine.chat({
            message: conversationHistory[conversationHistory.length - 1].content,
            chatHistory: conversationHistory.slice(0, -1),
            stream: true,
          });

          // Handle streaming response with proper error boundaries
          try {
            for await (const chunk of response) {
              // Check if controller is still active
              if (controller.desiredSize === null) {
                console.log('Stream controller closed, breaking loop');
                break;
              }

              const text = chunk.response || chunk.delta || chunk.message?.content || '';
              if (text) {
                try {
                  controller.enqueue(encoder.encode(text));
                } catch (enqueueError) {
                  console.warn('Failed to enqueue chunk:', enqueueError);
                  break;
                }
              }
            }
          } catch (streamError) {
            console.error('Streaming iteration error:', streamError);
            
            // Try to send an error message to the client
            try {
              controller.enqueue(encoder.encode('\n\n<p style="color: red;">Error occurred during streaming response.</p>'));
            } catch (errorEnqueueError) {
              console.warn('Failed to enqueue error message:', errorEnqueueError);
            }
          }
          
          // Close the controller safely
          try {
            controller.close();
          } catch (closeError) {
            console.warn('Controller already closed:', closeError);
          }

        } catch (error) {
          console.error('Chat engine error:', error);
          try {
            const errorMessage = encoder.encode(
              `<p style="color: red;">Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}</p>`
            );
            controller.enqueue(errorMessage);
            controller.close();
          } catch (controllerError) {
            console.error('Failed to send error through controller:', controllerError);
            try {
              controller.error(error);
            } catch (finalError) {
              console.error('Failed to error controller:', finalError);
            }
          }
        }
      },
      
      // Add cancel handler for when client disconnects
      cancel(reason) {
        console.log('Stream cancelled by client:', reason);
      }
    });

    // Return the stream response
    return new Response(customReadable, {
      headers: {
        Connection: "keep-alive",
        "Content-Encoding": "none",
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/event-stream; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Determine appropriate status code based on error type
    let statusCode = 500;
    let errorMessage = 'Failed to process chat request';
    
    if (error instanceof Error) {
      // Handle validation errors with 400 status
      if (error.message.includes('Missing required fields') || 
          error.message.includes('must be a non-empty string') ||
          error.message.includes('Invalid') ||
          error.message.includes('format')) {
        statusCode = 400;
        errorMessage = error.message;
      }
    }
    
    // Send error details to error tracking service
    try {
      const payload = {
        exception: error instanceof Error ? error.name + ': ' + error.message : String(error),
        repo_url: "https://github.com/sarim2000/guardian-platform",
        service: "guardian-project",
        stack_trace: error instanceof Error ? error.stack : 'No stack trace available',
        timestamp: new Date().toISOString(),
        request_body: await request.clone().text().catch(() => 'Unable to read request body')
      };
      
      console.log('Sending to self-healing service:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('http://localhost:8000/exception-healer/webhook/exception', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Self-healing service response:', response.status, await response.text());
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' && error instanceof Error 
          ? { name: error.name, stack: error.stack } 
          : undefined
      },
      { status: statusCode }
    );
  }
} 
