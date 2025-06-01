'use client'

import { useState } from 'react'
import { Box, Group, ActionIcon, Text, Tooltip, Code } from '@mantine/core'
import { IconCopy, IconCheck } from '@tabler/icons-react'

interface YamlViewerProps {
  content: string
  title?: string
  maxHeight?: string
}

export function YamlViewer({ content, title, maxHeight = '500px' }: YamlViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const formatYaml = (yaml: string) => {
    const lines = yaml.split('\n')
    return lines.map((line, index) => {
      const trimmedLine = line
      const indentLevel = line.length - line.trimStart().length
      
      // Apply syntax highlighting
      let formattedLine = trimmedLine
      
      // Comments (lines starting with #)
      if (trimmedLine.trim().startsWith('#')) {
        return (
          <div key={index} style={{ color: '#6b7280', fontStyle: 'italic' }}>
            {line}
          </div>
        )
      }
      
      // Keys (text before :)
      if (trimmedLine.includes(':') && !trimmedLine.trim().startsWith('-')) {
        const [key, ...valueParts] = trimmedLine.split(':')
        const value = valueParts.join(':')
        const indent = ' '.repeat(indentLevel)
        
        return (
          <div key={index}>
            <span style={{ color: '#7c3aed' }}>{key.trim()}</span>
            <span style={{ color: '#374151' }}>:</span>
            {value && (
              <span style={{ color: '#059669' }}>{value}</span>
            )}
          </div>
        )
      }
      
      // Array items (lines starting with -)
      if (trimmedLine.trim().startsWith('-')) {
        const content = trimmedLine.trim().substring(1).trim()
        const indent = ' '.repeat(indentLevel)
        
        return (
          <div key={index}>
            <span style={{ color: '#7c3aed' }}>-</span>
            <span style={{ color: '#059669' }}> {content}</span>
          </div>
        )
      }
      
      // Regular text
      return (
        <div key={index} style={{ color: '#374151' }}>
          {line}
        </div>
      )
    })
  }

  return (
    <Box
      style={{
        position: 'relative',
        borderRadius: '8px',
        border: '1px solid #000',
        // backgroundColor: '#fff',
        overflow: 'hidden'
      }}
    >
      {/* Header with title and copy button */}
      {(title || true) && (
        <Group
          justify="space-between"
          p="sm"
          style={{
            // backgroundColor: '#f3f4f6',
            borderBottom: '1px solid #d1d5db'
          }}
        >
          <Text size="sm" fw={500} c="dimmed">
            {title || 'YAML Configuration'}
          </Text>
          <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'}>
            <ActionIcon
              variant="subtle"
              color={copied ? 'green' : 'gray'}
              onClick={handleCopy}
              size="sm"
            >
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
      
      {/* YAML content */}
      <Code block style={{ fontSize: '14px' }}>
        {content}
      </Code>
    </Box>
  )
} 
