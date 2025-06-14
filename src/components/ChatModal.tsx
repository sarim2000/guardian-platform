import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Stack,
  ScrollArea,
  Text,
  Group,
  Paper,
  Alert,
  Title,
  Badge,
} from '@mantine/core';
import { IconMessageCircle, IconAlertCircle } from '@tabler/icons-react';
import { Service } from '@/types/service';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatStream } from '@/hooks/useChatStream';

interface ChatModalProps {
  opened: boolean;
  onClose: () => void;
  service: Service | null;
}

export function ChatModal({ opened, onClose, service }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { loading, sendMessage } = useChatStream({
    service,
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
    // Only auto-scroll if user is already near the bottom
    if (isScrolledToBottom()) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (opened && service) {
      // Reset messages when opening modal for a new service
      setMessages([]);
      setError(null);
      // Always scroll to bottom when opening
      setTimeout(scrollToBottom, 100);
    }
  }, [opened, service]);

  if (!service) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconMessageCircle size={20} />
          <div>
            <Title order={4}>Chat with Documentation</Title>
            <Text size="sm" c="dimmed">
              {service.displayName || service.serviceName}
            </Text>
          </div>
        </Group>
      }
      size="lg"
      styles={{
        body: { height: '70vh', display: 'flex', flexDirection: 'column' },
      }}
    >
      <Stack h="100%" gap="md">
        {/* Service Info */}
        <Paper p="sm" withBorder>
          <Group gap="xs">
            <Badge color="blue" variant="light">
              {service.organizationName}
            </Badge>
            <Badge color="grape" variant="light">
              {service.repositoryName}
            </Badge>
            {service.lifecycle && (
              <Badge color="gray" variant="outline">
                {service.lifecycle}
              </Badge>
            )}
          </Group>
        </Paper>

        {/* Messages */}
        <ScrollArea 
          flex={1} 
          offsetScrollbars
          ref={scrollAreaRef}
          onScrollCapture={(e) => {
            // Store scroll position for smart scrolling
            const target = e.target as HTMLDivElement;
            scrollAreaRef.current = target;
          }}
        >
          <Stack gap="md" p="xs">
            {messages.length === 0 && (
              <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text size="sm" c="dimmed" ta="center">
                  Ask questions about the documentation for {service.displayName || service.serviceName}
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
          autoFocus={opened}
        />
      </Stack>
    </Modal>
  );
} 
