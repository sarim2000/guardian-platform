'use client'

import {
  Button,
  Container,
  Paper,
  Title,
  Text,
  Stack,
  Alert,
  Grid,
  Group,
  Badge,
  Table,
  Modal,
  TextInput,
  Textarea,
  Select,
  Switch,
  MultiSelect,
} from '@mantine/core'
import {
  IconRefresh,
  IconAlertCircle,
  IconCloud,
  IconPlus,
  IconTrash,
  IconSettings,
  IconDatabase,
  IconCloudComputing,
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { useDisclosure } from '@mantine/hooks'

// Types
interface ProcessedResult {
  repository: string
  status: 'success' | 'error'
  error?: string
}

interface IngestionResponse {
  message: string
  processed: ProcessedResult[]
}

interface AWSAccount {
  id: string
  accountName: string
  accountId: string
  defaultRegion: string
  regions: string[]
  isActive: boolean
  isDefault: boolean
  description?: string
  organizationRole?: string
  createdAt: Date
  lastUsed?: Date
}

interface AWSDiscoveryResponse {
  message: string
  resourcesDiscovered: number
  accountsProcessed: number
}

// AWS Regions
const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-west-2', label: 'Europe (London)' },
  { value: 'eu-west-3', label: 'Europe (Paris)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'eu-north-1', label: 'Europe (Stockholm)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ca-central-1', label: 'Canada (Central)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
]

export default function CatalogAdminPage() {
  // Catalog Ingestion State
  const [isIngestionLoading, setIsIngestionLoading] = useState(false)
  const [ingestionResults, setIngestionResults] = useState<ProcessedResult[]>([])
  const [ingestionError, setIngestionError] = useState<string | null>(null)

  // AWS Discovery State
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false)
  const [discoveryResults, setDiscoveryResults] = useState<AWSDiscoveryResponse | null>(null)
  const [discoveryError, setDiscoveryError] = useState<string | null>(null)

  // AWS Accounts State
  const [awsAccounts, setAwsAccounts] = useState<AWSAccount[]>([])
  const [isAccountsLoading, setIsAccountsLoading] = useState(false)
  const [accountsError, setAccountsError] = useState<string | null>(null)

  // Add Account Modal State
  const [addAccountOpened, { open: openAddAccount, close: closeAddAccount }] = useDisclosure(false)
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [newAccount, setNewAccount] = useState({
    accountName: '',
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    defaultRegion: 'us-east-1',
    regions: ['us-east-1'],
    description: '',
    organizationRole: '',
    isDefault: false,
  })

  // Load AWS accounts on component mount
  useEffect(() => {
    loadAWSAccounts()
  }, [])

  const loadAWSAccounts = async () => {
    setIsAccountsLoading(true)
    setAccountsError(null)

    try {
      const response = await fetch('/api/aws/accounts')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load AWS accounts')
      }

      setAwsAccounts(data.data || [])
    } catch (err: any) {
      setAccountsError(err.message)
    } finally {
      setIsAccountsLoading(false)
    }
  }

  const triggerIngestion = async () => {
    setIsIngestionLoading(true)
    setIngestionError(null)
    setIngestionResults([])

    try {
      const response = await fetch('/api/catalog/ingestion/trigger', {
        method: 'POST',
      })

      const data: IngestionResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to trigger ingestion')
      }

      setIngestionResults(data.processed)
    } catch (err: any) {
      setIngestionError(err.message)
    } finally {
      setIsIngestionLoading(false)
    }
  }

  const triggerAWSDiscovery = async () => {
    setIsDiscoveryLoading(true)
    setDiscoveryError(null)
    setDiscoveryResults(null)

    try {
      const response = await fetch('/api/aws/discover', {
        method: 'POST',
      })

      const data: AWSDiscoveryResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to trigger AWS discovery')
      }

      setDiscoveryResults(data)
    } catch (err: any) {
      setDiscoveryError(err.message)
    } finally {
      setIsDiscoveryLoading(false)
    }
  }

  const addAWSAccount = async () => {
    setIsAddingAccount(true)

    try {
      const response = await fetch('/api/aws/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAccount),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add AWS account')
      }

      // Reset form and close modal
      setNewAccount({
        accountName: '',
        accountId: '',
        accessKeyId: '',
        secretAccessKey: '',
        defaultRegion: 'us-east-1',
        regions: ['us-east-1'],
        description: '',
        organizationRole: '',
        isDefault: false,
      })
      closeAddAccount()

      // Reload accounts
      await loadAWSAccounts()
    } catch (err: any) {
      setAccountsError(err.message)
    } finally {
      setIsAddingAccount(false)
    }
  }

  const removeAWSAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/aws/accounts?accountId=${accountId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove AWS account')
      }

      // Reload accounts
      await loadAWSAccounts()
    } catch (err: any) {
      setAccountsError(err.message)
    }
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title order={1}>Administration Dashboard</Title>

        {/* Service Catalog Management */}
        <Paper shadow="sm" p="xl" withBorder>
          <Stack gap="lg">
            <Group>
              <IconDatabase size={24} />
              <Title order={2}>Service Catalog Management</Title>
            </Group>

            <Text color="dimmed">
              Trigger a catalog ingestion to scan all repositories and update the service catalog.
            </Text>

            <Button leftSection={<IconRefresh size={20} />} onClick={triggerIngestion} loading={isIngestionLoading}>
              Trigger Catalog Ingestion
            </Button>

            {ingestionError && (
              <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                {ingestionError}
              </Alert>
            )}

            {ingestionResults.length > 0 && (
              <Paper withBorder p="md">
                <Title order={4} mb="md">
                  Processing Results
                </Title>
                <Stack gap="xs">
                  {ingestionResults.map((result, index) => (
                    <Alert key={index} color={result.status === 'success' ? 'green' : 'red'} title={result.repository}>
                      {result.status === 'success' ? 'Successfully processed' : `Error: ${result.error}`}
                    </Alert>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Paper>

        {/* AWS Management */}
        <Grid>
          {/* AWS Resource Discovery */}
          <Grid.Col span={6}>
            <Paper shadow="sm" p="xl" withBorder h="100%">
              <Stack gap="lg">
                <Group>
                  <IconCloudComputing size={24} />
                  <Title order={2}>AWS Resource Discovery</Title>
                </Group>

                <Text color="dimmed">
                  Discover AWS resources across all configured accounts and update the inventory.
                </Text>

                <Button
                  leftSection={<IconCloud size={20} />}
                  onClick={triggerAWSDiscovery}
                  loading={isDiscoveryLoading}
                  disabled={awsAccounts.length === 0}
                >
                  Discover AWS Resources
                </Button>

                {discoveryError && (
                  <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                    {discoveryError}
                  </Alert>
                )}

                {discoveryResults && (
                  <Alert color="green" title="Discovery Complete">
                    Discovered {discoveryResults.resourcesDiscovered} resources across{' '}
                    {discoveryResults.accountsProcessed} accounts
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* AWS Account Summary */}
          <Grid.Col span={6}>
            <Paper shadow="sm" p="xl" withBorder h="100%">
              <Stack gap="lg">
                <Group>
                  <IconSettings size={24} />
                  <Title order={2}>AWS Account Summary</Title>
                </Group>

                <Grid>
                  <Grid.Col span={6}>
                    <Paper withBorder p="md" ta="center">
                      <Text size="xl" fw={700} c="blue">
                        {awsAccounts.length}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Total Accounts
                      </Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Paper withBorder p="md" ta="center">
                      <Text size="xl" fw={700} c="green">
                        {awsAccounts.filter((acc) => acc.isActive).length}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Active Accounts
                      </Text>
                    </Paper>
                  </Grid.Col>
                </Grid>

                <Button leftSection={<IconPlus size={20} />} onClick={openAddAccount} variant="light">
                  Add AWS Account
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* AWS Accounts Table */}
        <Paper shadow="sm" p="xl" withBorder>
          <Stack gap="lg">
            <Group justify="space-between">
              <Title order={2}>AWS Accounts</Title>
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={loadAWSAccounts}
                loading={isAccountsLoading}
                variant="light"
                size="sm"
              >
                Refresh
              </Button>
            </Group>

            {accountsError && (
              <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                {accountsError}
              </Alert>
            )}

            {awsAccounts.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Account Name</Table.Th>
                    <Table.Th>Account ID</Table.Th>
                    <Table.Th>Default Region</Table.Th>
                    <Table.Th>Regions</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Last Used</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {awsAccounts.map((account) => (
                    <Table.Tr key={account.id}>
                      <Table.Td>
                        <Group gap="xs">
                          <Text fw={500}>{account.accountName}</Text>
                          {account.isDefault && (
                            <Badge size="xs" color="blue">
                              Default
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>{account.accountId || 'N/A'}</Table.Td>
                      <Table.Td>{account.defaultRegion}</Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {account.regions.length} region{account.regions.length !== 1 ? 's' : ''}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={account.isActive ? 'green' : 'red'} size="sm">
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {account.lastUsed ? new Date(account.lastUsed).toLocaleDateString() : 'Never'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => removeAWSAccount(account.id)}
                        >
                          Remove
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text ta="center" c="dimmed" py="xl">
                No AWS accounts configured. Add your first account to start discovering resources.
              </Text>
            )}
          </Stack>
        </Paper>
      </Stack>

      {/* Add AWS Account Modal */}
      <Modal opened={addAccountOpened} onClose={closeAddAccount} title="Add AWS Account" size="lg">
        <Stack gap="md">
          <TextInput
            label="Account Name"
            placeholder="My AWS Account"
            value={newAccount.accountName}
            onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
            required
          />

          <TextInput
            label="AWS Account ID"
            placeholder="123456789012"
            value={newAccount.accountId}
            onChange={(e) => setNewAccount({ ...newAccount, accountId: e.target.value })}
            description="12-digit AWS Account ID"
            required
          />

          <TextInput
            label="AWS Access Key ID"
            placeholder="AKIA..."
            value={newAccount.accessKeyId}
            onChange={(e) => setNewAccount({ ...newAccount, accessKeyId: e.target.value })}
            required
          />

          <TextInput
            label="AWS Secret Access Key"
            type="password"
            placeholder="..."
            value={newAccount.secretAccessKey}
            onChange={(e) => setNewAccount({ ...newAccount, secretAccessKey: e.target.value })}
            required
          />

          <Select
            label="Default Region"
            value={newAccount.defaultRegion}
            onChange={(value) =>
              setNewAccount({
                ...newAccount,
                defaultRegion: value || 'us-east-1',
                regions: [value || 'us-east-1'],
              })
            }
            data={AWS_REGIONS}
            required
          />

          <MultiSelect
            label="Additional Regions"
            placeholder="Select regions to scan"
            value={newAccount.regions}
            onChange={(value) => setNewAccount({ ...newAccount, regions: value })}
            data={AWS_REGIONS}
          />

          <Textarea
            label="Description"
            placeholder="Optional description..."
            value={newAccount.description}
            onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
            rows={3}
          />

          <TextInput
            label="Organization Role"
            placeholder="e.g., Production, Development, Staging"
            value={newAccount.organizationRole}
            onChange={(e) => setNewAccount({ ...newAccount, organizationRole: e.target.value })}
          />

          <Switch
            label="Set as default account"
            checked={newAccount.isDefault}
            onChange={(e) => setNewAccount({ ...newAccount, isDefault: e.currentTarget.checked })}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={closeAddAccount}>
              Cancel
            </Button>
            <Button
              onClick={addAWSAccount}
              loading={isAddingAccount}
              disabled={
                !newAccount.accountName ||
                !newAccount.accountId ||
                !newAccount.accessKeyId ||
                !newAccount.secretAccessKey
              }
            >
              Add Account
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
