import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Button,
  ScrollArea,
  Text,
  Group,
  Paper,
  Loader,
  Alert,
  ActionIcon,
  Title,
  Badge,
} from '@mantine/core';
import { IconSend, IconMessageCircle, IconAlertCircle, IconRobot, IconUser } from '@tabler/icons-react';
import { Service } from '@/types/service';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatModalProps {
  opened: boolean;
  onClose: () => void;
  service: Service | null;
}

export function ChatModal({ opened, onClose, service }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (opened && service) {
      // Reset messages when opening modal for a new service
      setMessages([]);
      setError(null);
    }
  }, [opened, service]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !service || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue.trim(),
          repoName: service.repositoryName,
          organizationName: service.organizationName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from chat API');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

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
        <ScrollArea flex={1} offsetScrollbars>
          <Stack gap="md" p="xs">
            {messages.length === 0 && (
              <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text size="sm" c="dimmed" ta="center">
                  Ask questions about the documentation for {service.displayName || service.serviceName}
                </Text>
              </Paper>
            )}

            {messages.map((message) => (
              <Group key={message.id} align="flex-start" gap="sm">
                <ActionIcon
                  size="sm"
                  variant="light"
                  color={message.role === 'user' ? 'blue' : 'violet'}
                  style={{ marginTop: 4 }}
                >
                  {message.role === 'user' ? <IconUser size={14} /> : <IconRobot size={14} />}
                </ActionIcon>

                <Paper
                  p="sm"
                  withBorder
                >
                  <div dangerouslySetInnerHTML={{ __html: message.content }} />
                  <Text size="xs" c="dimmed" mt="xs">
                    {message.timestamp.toLocaleTimeString()}
                  </Text>
                </Paper>
              </Group>
            ))}

            {loading && (
              <Group align="flex-start" gap="sm">
                <ActionIcon size="sm" variant="light" color="violet" style={{ marginTop: 4 }}>
                  <IconRobot size={14} />
                </ActionIcon>
                <Paper p="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-violet-0)' }}>
                  <Group gap="xs">
                    <Loader size="xs" />
                    <Text size="sm">Thinking...</Text>
                  </Group>
                </Paper>
              </Group>
            )}

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
        <Group gap="sm">
          <TextInput
            flex={1}
            placeholder="Ask a question about the documentation..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || loading}
            leftSection={<IconSend size={16} />}
          >
            Send
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
} 
