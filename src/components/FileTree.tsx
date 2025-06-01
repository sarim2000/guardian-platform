import { Stack, Group, Text, Box } from '@mantine/core'
import { IconFolder, IconFile } from '@tabler/icons-react'

interface FileTreeItem {
  name: string
  type: 'file' | 'folder'
  children?: FileTreeItem[]
}

interface FileTreeProps {
  items: FileTreeItem[]
  level?: number
}

export function FileTree({ items, level = 0 }: FileTreeProps) {
  return (
    <Box
      p="md"
      // bg="gray.1"
      style={{
        borderRadius: '8px',
        border: '1px solid #000',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace'
      }}
    >
      <Stack gap="xs">
        {items.map((item, index) => (
          <FileTreeNode 
            key={`${item.name}-${index}`} 
            item={item} 
            level={level}
            isLast={index === items.length - 1}
          />
        ))}
      </Stack>
    </Box>
  )
}

interface FileTreeNodeProps {
  item: FileTreeItem
  level: number
  isLast: boolean
}

function FileTreeNode({ item, level, isLast }: FileTreeNodeProps) {
  const indent = level * 24

  return (
    <>
      <Group gap="xs" style={{ paddingLeft: indent }}>
        {/* Tree connector */}
        <Box
          style={{
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // color: '#6b7280'
          }}
        >
          {level > 0 && (
            <Text size="sm" style={{ fontFamily: 'monospace' }}>
              {isLast ? '└─' : '├─'}
            </Text>
          )}
        </Box>

        {/* Icon */}
        {item.type === 'folder' ? (
          <IconFolder size={16} color="#f59e0b" />
        ) : (
          <IconFile size={16} color="#6b7280" />
        )}

        {/* Name */}
        <Text 
          size="sm" 
          c={item.type === 'folder' ? 'blue' : 'gray.1'}
          fw={item.type === 'folder' ? 600 : 400}
          style={{ fontFamily: 'monospace' }}
        >
          {item.name}
        </Text>
      </Group>

      {/* Children */}
      {item.children && item.children.length > 0 && (
        <Stack gap="xs">
          {item.children.map((child, index) => (
            <FileTreeNode
              key={`${child.name}-${index}`}
              item={child}
              level={level + 1}
              isLast={index === item.children!.length - 1}
            />
          ))}
        </Stack>
      )}
    </>
  )
} 
