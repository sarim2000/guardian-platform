'use client';

import { useState, useRef, useEffect } from 'react';
import { Stack, ScrollArea, Text, Paper, Alert } from '@mantine/core';
import { Service } from '@/types/service';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatStream } from '@/hooks/useChatStream';
import { IconAlertCircle } from '@tabler/icons-react';

interface ChatInterfaceProps {
  service: Service | null;
  organizationName: string;
  repositoryName: string;
}

export function ChatInterface({ service, organizationName, repositoryName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { loading, sendMessage } = useChatStream({
    service: {
      organizationName,
      repositoryName,
      serviceName: service ? service.serviceName : '',
    },
    messages,
    setMessages,
    setError,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isScrolledToBottom = () => {
    if (!scrollAreaRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  useEffect(() => {
    if (isScrolledToBottom()) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    // Reset messages when the context changes
    setMessages([]);
    setError(null);
    setTimeout(scrollToBottom, 100);
  }, [organizationName, repositoryName]);
  
  const displayName = service?.displayName || repositoryName;

  return (
    <Stack h="100%" gap="md">
      {/* Messages */}
      <ScrollArea 
        flex={1} 
        offsetScrollbars
        ref={scrollAreaRef}
      >
        <Stack gap="md" p="xs">
          {messages.length === 0 && (
            <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
              <Text size="sm" c="dimmed" ta="center">
                Ask questions about the documentation for {displayName}
              </Text>
            </Paper>
          )}

          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              isStreaming={loading && message.role === 'assistant'}
            />
          ))}

          <div ref={messagesEndRef} />
        </Stack>
      </ScrollArea>

      {/* Error Alert */}
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {/* Input */}
      <ChatInput 
        onSendMessage={sendMessage}
        loading={loading}
        autoFocus
      />
    </Stack>
  );
} 
