'use client'

import { Button, Container, Paper, Title, Text, Stack, Alert } from '@mantine/core'
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react'
import { useState } from 'react'

interface ProcessedResult {
  repository: string
  status: 'success' | 'error'
  error?: string
}

interface IngestionResponse {
  message: string
  processed: ProcessedResult[]
}

export default function CatalogAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ProcessedResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const triggerIngestion = async () => {
    setIsLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/api/catalog/ingestion/trigger', {
        method: 'POST',
      })

      const data: IngestionResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to trigger ingestion')
      }

      setResults(data.processed)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="lg">
          <Title order={2}>Catalog Management</Title>

          <Text color="dimmed">
            Trigger a catalog ingestion to scan all repositories and update the service catalog.
          </Text>

          <Button leftSection={<IconRefresh size={20} />} onClick={triggerIngestion} loading={isLoading}>
            Trigger Catalog Ingestion
          </Button>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
              {error}
            </Alert>
          )}

          {results.length > 0 && (
            <Paper withBorder p="md">
              <Title order={4} mb="md">
                Processing Results
              </Title>
              <Stack gap="xs">
                {results.map((result, index) => (
                  <Alert key={index} color={result.status === 'success' ? 'green' : 'red'} title={result.repository}>
                    {result.status === 'success' ? 'Successfully processed' : `Error: ${result.error}`}
                  </Alert>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
