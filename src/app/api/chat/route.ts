import { NextResponse } from 'next/server';
import { LlamaService } from '@/services/llama';

export async function POST(request: Request) {
  try {
    const { message, repoName, organizationName } = await request.json();

    if (!message || !repoName || !organizationName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const llamaService = LlamaService.getInstance(organizationName);
    const chatEngine = await llamaService.createChatEngine(repoName, organizationName);

    const systemPrompt = `
      You are a helpful assistant that can answer questions about the documentation of the service. 
      Format your response in html only.
    `;

    const formattedMessage = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...message.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ]
    
    const response = await chatEngine.chat({
      message: formattedMessage,
      stream: false,
    });

    return NextResponse.json({ response: response.response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 
