import { NextResponse } from 'next/server';
import { LlamaService } from '@/services/llama';

// Function to send errors to webhook
async function sendErrorToWebhook(error: Error, context: {
  service: string;
  file_path: string;
  line_number?: number;
  additional_context?: any;
}) {
  try {
    const webhookPayload = {
      service: "guardian-platform",
      exception: error.name + ': ' + error.message,
      stack_trace: error.stack || 'No stack trace available',
      file_path: context.file_path,
      line_number: context.line_number || 0,
      additional_context: context.additional_context
    };

    const response = await fetch('http://127.0.0.1:8000/webhook/exception', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      console.error('Failed to send error to webhook:', response.status, response.statusText);
    } else {
      console.log('Error sent to webhook successfully');
    }
  } catch (webhookError) {
    console.error('Error sending to webhook:', webhookError);
  }
}

export async function POST(request: Request) {
  try {
    // remove after testing
    const testError = new Error('test for error, this should be removed');
    throw testError;

    const { message, messages = [], repoName, organizationName, serviceName } = await request.json();

    // Debug logging to see what's being received
    console.log('Chat API received:', {
      message: message ? '[message present]' : '[message missing]',
      repoName,
      organizationName,
      serviceName,
      messagesCount: messages.length
    });

    if (!message || !repoName || !organizationName || !serviceName) {
      console.log('Missing required fields:', {
        message: !!message,
        repoName: !!repoName,
        organizationName: !!organizationName,
        serviceName: !!serviceName
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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
          llamaService = LlamaService.getInstance(organizationName);
          chatEngine = await llamaService.createChatEngine(repoName, organizationName, serviceName);

          const response = await chatEngine.chat({
            message: conversationHistory[conversationHistory.length - 1].content,
            chatHistory: conversationHistory.slice(0, -1),
            stream: true,
          });

          // console log retrieved documents
          console.log('Retrieved documents:', response.retrievedDocuments);

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
    // Send error to webhook
    if (error instanceof Error) {
      await sendErrorToWebhook(error, {
        service: 'guardian-platform',
        file_path: 'src/app/api/chat/route.ts',
        line_number: 90,
        additional_context: { context: 'Chat engine creation or streaming error' }
      });
    }
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 
