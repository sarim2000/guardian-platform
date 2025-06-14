import { useState, useRef, useEffect } from 'react';
import { TextInput, Button, Group } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  loading: boolean;
  autoFocus?: boolean;
}

export function ChatInput({ onSendMessage, loading, autoFocus = false }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleSend = () => {
    if (!inputValue.trim() || loading) return;
    
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Group gap="sm">
      <TextInput
        ref={inputRef}
        flex={1}
        placeholder="Ask a question about the documentation..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={loading}
        size="md"
      />
      <Button
        onClick={handleSend}
        disabled={!inputValue.trim() || loading}
        leftSection={<IconSend size={16} />}
        size="md"
      >
        Send
      </Button>
    </Group>
  );
} 
