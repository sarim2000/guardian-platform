import { useState, useCallback } from 'react';
import { type ChatMessage } from '@/types/chat';

interface Service {
  repositoryName: string;
  organizationName: string;
}

interface UseChatStreamProps {
  service: Service | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setError: (error: string | null) => void;
}

export function useChatStream({ service, messages, setMessages, setError }: UseChatStreamProps) {
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!service || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    // Create placeholder for assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    let reader: ReadableStreamDefaultReader<string> | null = null;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          repoName: service.repositoryName,
          organizationName: service.organizationName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Handle streaming response with better error handling
      reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();

      let incomingMessage = "";
      let hasReceivedData = false;

      while (true) {
        try {
          const { value, done } = await reader.read();
          
          if (done) {
            // Only update if we actually received some data
            if (hasReceivedData) {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: incomingMessage || 'No response received.' }
                    : msg
                )
              );
            } else {

              // No data received, show error
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: '<p style="color: orange;">No response received from the server.</p>' }
                    : msg
                )
              );
            }
            break;
          }
          
          if (value) {
            hasReceivedData = true;
            incomingMessage += value;
            console.log(incomingMessage);
            // Update the assistant message in real-time
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: incomingMessage }
                  : msg
              )
            );
          }
        } catch (readError) {
          console.error('Stream read error:', readError);
          // If we got some data before the error, keep it
          if (hasReceivedData && incomingMessage) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: incomingMessage + '\n\n<p style="color: orange;"><em>Connection interrupted</em></p>' }
                  : msg
              )
            );
          } else {
            throw readError; // Re-throw if we didn't get any data
          }
          break;
        }
      }

    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message');
      // Remove the placeholder assistant message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      // Clean up the reader
      if (reader) {
        try {
          reader.cancel();
        } catch (cancelError) {
          console.warn('Failed to cancel reader:', cancelError);
        }
      }
      setLoading(false);
    }
  }, [service, messages, setMessages, setError, loading]);

  return {
    loading,
    sendMessage,
  };
} 
