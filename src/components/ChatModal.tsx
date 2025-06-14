import { useState } from 'react';
import { Modal, Group, Title, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconMessageCircle, IconArrowsMaximize, IconArrowsMinimize } from '@tabler/icons-react';
import { Service } from '@/types/service';
import { ChatInterface } from '@/components/chat/ChatInterface';

interface ChatModalProps {
  opened: boolean;
  onClose: () => void;
  service: Service | null;
}

export function ChatModal({ opened, onClose, service }: ChatModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!service) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group justify="space-between" style={{ width: '100%' }}>
            <Group gap="sm">
                <IconMessageCircle size={20} />
                <div>
                    <Title order={4}>Chat with Documentation</Title>
                    <Text size="sm" c="dimmed">
                    {service.displayName || service.serviceName}
                    </Text>
                </div>
            </Group>
            <Tooltip label={isExpanded ? 'Shrink' : 'Expand'} withArrow>
              <ActionIcon
                  variant="subtle"
                  onClick={() => setIsExpanded((e) => !e)}
                  size="lg"
              >
                  {isExpanded ? <IconArrowsMinimize size={18} /> : <IconArrowsMaximize size={18} />}
              </ActionIcon>
            </Tooltip>
        </Group>
      }
      size={isExpanded ? '95vw' : 'xl'}
      transitionProps={{ transition: 'pop', duration: 200 }}
      styles={{
        body: { height: isExpanded ? '85vh' : '70vh', display: 'flex', flexDirection: 'column' },
        header: { paddingRight: 'var(--mantine-spacing-sm)' }
      }}
    >
      <ChatInterface
        service={service}
        organizationName={service.organizationName}
        repositoryName={service.repositoryName}
      />
    </Modal>
  );
} 
