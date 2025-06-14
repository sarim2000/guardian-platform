import { ActionIcon, Paper, Text, Group, Divider, Loader, TypographyStylesProvider } from '@mantine/core'
import { IconUser, IconRobot } from '@tabler/icons-react'
import { type ChatMessage } from '@/types/chat'
import { CodeBlock, InlineCode } from './CodeBlock'
import React from 'react'

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

// Function to parse HTML and replace code blocks with React components
function parseHtmlWithCodeBlocks(html: string): React.ReactNode[] {
  if (!html) return []
  
  const elements: React.ReactNode[] = []
  let currentIndex = 0
  let elementKey = 0
  
  // Regex to match code blocks: <pre><code>...</code></pre> with optional language attribute
  const codeBlockRegex = /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g
  // Regex to match inline code: <code>...</code>
  const inlineCodeRegex = /<code>(.*?)<\/code>/g
  
  let match
  let lastProcessedIndex = 0
  
  // First, process code blocks
  while ((match = codeBlockRegex.exec(html)) !== null) {
    const [fullMatch, language, codeContent] = match
    const matchStart = match.index
    
    // Add HTML content before this code block
    if (matchStart > lastProcessedIndex) {
      const beforeContent = html.slice(lastProcessedIndex, matchStart)
      if (beforeContent.trim()) {
        elements.push(
          <div
            key={`html-${elementKey++}`}
            dangerouslySetInnerHTML={{ __html: beforeContent }}
          />
        )
      }
    }
    
    // Add the code block component
    const decodedContent = codeContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
    
    elements.push(
      <CodeBlock key={`code-block-${elementKey++}`} language={language}>
        {decodedContent}
      </CodeBlock>
    )
    
    lastProcessedIndex = matchStart + fullMatch.length
  }
  
  // Add remaining HTML content
  if (lastProcessedIndex < html.length) {
    let remainingContent = html.slice(lastProcessedIndex)
    
    // Process inline code in the remaining content
    const inlineCodeParts: React.ReactNode[] = []
    let inlineLastIndex = 0
    let inlineElementKey = 0
    
    while ((match = inlineCodeRegex.exec(remainingContent)) !== null) {
      const [fullMatch, codeContent] = match
      const matchStart = match.index
      
      // Add content before inline code
      if (matchStart > inlineLastIndex) {
        const beforeInlineContent = remainingContent.slice(inlineLastIndex, matchStart)
        if (beforeInlineContent.trim()) {
          inlineCodeParts.push(
            <span
              key={`inline-html-${inlineElementKey++}`}
              dangerouslySetInnerHTML={{ __html: beforeInlineContent }}
            />
          )
        }
      }
      
      // Add inline code component
      const decodedInlineContent = codeContent
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
      
      inlineCodeParts.push(
        <InlineCode key={`inline-code-${inlineElementKey++}`}>
          {decodedInlineContent}
        </InlineCode>
      )
      
      inlineLastIndex = matchStart + fullMatch.length
    }
    
    // Add remaining content after last inline code
    if (inlineLastIndex < remainingContent.length) {
      const finalContent = remainingContent.slice(inlineLastIndex)
      if (finalContent.trim()) {
        inlineCodeParts.push(
          <span
            key={`final-html-${inlineElementKey++}`}
            dangerouslySetInnerHTML={{ __html: finalContent }}
          />
        )
      }
    }
    
    if (inlineCodeParts.length === 0 && remainingContent.trim()) {
      // No inline code found, add as regular HTML
      elements.push(
        <div
          key={`final-html-${elementKey++}`}
          dangerouslySetInnerHTML={{ __html: remainingContent }}
        />
      )
    } else if (inlineCodeParts.length > 0) {
      // Wrap inline code parts in a container
      elements.push(
        <div key={`inline-container-${elementKey++}`}>
          {inlineCodeParts}
        </div>
      )
    }
  }
  
  // If no code blocks were found, return the original HTML
  if (elements.length === 0) {
    return [
      <div
        key="original-html"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    ]
  }
  
  return elements
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
            >
              {parseHtmlWithCodeBlocks(message.content)}
            </div>
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
