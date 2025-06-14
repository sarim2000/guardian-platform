import { ActionIcon, Paper, Text, Group, Divider, Loader, TypographyStylesProvider } from '@mantine/core'
import { IconUser, IconRobot } from '@tabler/icons-react'
import { type ChatMessage } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessage
  isStreaming?: boolean
}

// Typing indicator component
function TypingIndicator() {
  return (
    <Group gap="xs" style={{ color: 'var(--mantine-color-dimmed)' }}>
      <Loader size="xs" />
      <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
        typing...
      </Text>
    </Group>
  )
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const showTypingIndicator = isStreaming && message.role === 'assistant' && !message.content.trim()

  return (
    <Group align="flex-start" gap="sm">
      <ActionIcon
        size="sm"
        variant="light"
        color={message.role === 'user' ? 'blue' : 'violet'}
        style={{ marginTop: 4, flexShrink: 0 }}
      >
        {message.role === 'user' ? <IconUser size={14} /> : <IconRobot size={14} />}
      </ActionIcon>

      <Paper
        p="md"
        withBorder
        style={{
          backgroundColor: message.role === 'user' ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-violet-1)',
          flex: 1,
          maxWidth: '85%',
          minHeight: showTypingIndicator ? '60px' : 'auto',
        }}
      >
        {showTypingIndicator ? (
          <TypingIndicator />
        ) : message.role === 'user' ? (
          <Text c="black" size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Text>
        ) : (
          <TypographyStylesProvider>
            <div
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'black',
              }}
              dangerouslySetInnerHTML={{
                __html: message.content,
              }}
            />
          </TypographyStylesProvider>
        )}

        {!showTypingIndicator && (
          <>
            <Divider my="xs" />
            <Text size="xs" c="dimmed">
              {message.timestamp.toLocaleTimeString()}
            </Text>
          </>
        )}
      </Paper>
    </Group>
  )
}
