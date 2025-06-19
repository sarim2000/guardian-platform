import React, { useState } from 'react';
import { Box, Button, ScrollArea } from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';

interface CodeBlockProps {
  children: React.ReactNode;
  language?: string;
}

export function CodeBlock({ children, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const content = typeof children === 'string' ? children : children?.toString() || '';
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Box
      style={{
        position: 'relative',
        backgroundColor: '#1e1e1e',
        borderRadius: '6px',
        margin: '12px 0',
        overflow: 'hidden',
        border: '1px solid #404040',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Copy Button */}
      <Button
        variant="subtle"
        size="xs"
        leftSection={copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: copied ? '#22c55e' : '#374151',
          color: copied ? 'white' : '#d1d5db',
          opacity: isHovered || copied ? 1 : 0,
          transition: 'opacity 0.2s ease',
          zIndex: 10,
          border: '1px solid #4b5563',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </Button>

      <ScrollArea
        style={{
          maxHeight: '400px',
          overflow: 'scroll',
        }}
      >
        <Box
          component="pre"
          style={{
            backgroundColor: 'transparent',
            color: '#e5e7eb',
            whiteSpace: 'pre-wrap',
            fontFamily: 'Monaco, Consolas, "SF Mono", "Cascadia Code", "Roboto Mono", Courier, monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            padding: '16px',
            paddingTop: '20px', // Extra padding for the floating button
            margin: '0',
            overflow: 'visible',
          }}
        >
          {content}
        </Box>
      </ScrollArea>
    </Box>
  );
}

interface InlineCodeProps {
  children: React.ReactNode;
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <Box
      component="code"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        color: '#1f2937',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.9em',
        fontWeight: 500,
        fontFamily: 'Monaco, Consolas, "SF Mono", "Cascadia Code", "Roboto Mono", Courier, monospace',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        display: 'inline',
      }}
    >
      {children}
    </Box>
  );
} 
