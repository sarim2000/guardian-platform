'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Table,
  Button,
  Group,
  Select,
  TextInput,
  Badge,
  Text,
  Paper,
  Stack,
  Pagination,
  Alert,
  LoadingOverlay,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Modal,
  Card,
  Grid,
  Progress,
  ThemeIcon,
  Flex,
  Switch,
} from '@mantine/core';
import { 
  IconRefresh, 
  IconSearch, 
  IconAlertCircle, 
  IconCloud,
  IconEye,
  IconCircleCheck,
  IconCircleX,
  IconCircleDot,
  IconActivity,
  IconClock,
  IconServer,
  IconDatabase,
  IconFunction,
  IconContainer,
  IconScale,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react';
import {
  getResourceTypeColor,
  getResourceTypeIcon,
  getHealthStatusIcon,
  getResourceStateColor,
  AWS_REGIONS,
  AWS_RESOURCE_TYPES,
  extractStatusDetails,
  extractOperationalMetrics,
} from '@/utils/aws-utils';

interface AWSResource {
  id: string;
  arn: string;
  awsAccountId: string;
  awsRegion: string;
  resourceType: string;
  nameTag?: string;
  allTags: Record<string, string>;
  resourceState?: string;
  healthStatus?: string;
  isActive?: boolean;
  isStarred: boolean;
  operationalMetrics?: Record<string, any>;
  statusDetails?: Record<string, any>;
  firstDiscoveredAt: string;
  lastSeenAt: string;
  statusLastChecked?: string;
  accountName?: string;
}

interface APIResponse {
  success: boolean;
  data: AWSResource[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  filters: {
    resourceType?: string;
    region?: string;
    accountName?: string;
    starredOnly?: boolean;
  };
  error?: string;
}

interface AWSAccount {
  id: string;
  accountName: string;
  accountId: string;
  defaultRegion: string;
  regions: string[];
  isActive: boolean;
  isDefault: boolean;
  description?: string;
  organizationRole?: string;
  createdAt: Date;
  lastUsed?: Date;
}

export default function AWSResourcesPage() {
  const [resources, setResources] = useState<AWSResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedResource, setSelectedResource] = useState<AWSResource | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  // AWS Accounts state
  const [awsAccounts, setAwsAccounts] = useState<AWSAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  
  // Filters
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [starredOnlyFilter, setStarredOnlyFilter] = useState(false);
  const [activeOnlyFilter, setActiveOnlyFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAwsAccounts = async () => {
    setAccountsLoading(true);
    try {
      const response = await fetch('/api/aws/accounts');
      const data = await response.json();
      
      if (data.success) {
        setAwsAccounts(data.data.filter((account: AWSAccount) => account.isActive));
      } else {
        console.error('Failed to fetch AWS accounts:', data.error);
      }
    } catch (err) {
      console.error('Error fetching AWS accounts:', err);
    } finally {
      setAccountsLoading(false);
    }
  };

  const toggleStarred = async (resourceId: string, currentStarredState: boolean) => {
    try {
      const response = await fetch('/api/aws/resources', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId,
          isStarred: !currentStarredState,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the local state
        setResources(prevResources => 
          prevResources.map(resource => 
            resource.id === resourceId 
              ? { ...resource, isStarred: !currentStarredState }
              : resource
          )
        );
        
        // Update selected resource if it's the one being toggled
        if (selectedResource?.id === resourceId) {
          setSelectedResource(prev => prev ? { ...prev, isStarred: !currentStarredState } : null);
        }
      } else {
        setError(data.error || 'Failed to update starred status');
      }
    } catch (err) {
      setError('Failed to update starred status');
      console.error('Error toggling starred status:', err);
    }
  };

  const fetchResources = async (currentPage = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      
      if (resourceTypeFilter) params.append('resourceType', resourceTypeFilter);
      if (regionFilter) params.append('region', regionFilter);
      if (accountFilter) params.append('accountName', accountFilter);
      if (starredOnlyFilter) params.append('starredOnly', 'true');
      
      const response = await fetch(`/api/aws/resources?${params}`);
      const data: APIResponse = await response.json();
      
      if (data.success) {
        setResources(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
      } else {
        setError(data.error || 'Failed to fetch resources');
      }
    } catch (err) {
      setError('Failed to fetch AWS resources');
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerDiscovery = async () => {
    setDiscovering(true);
    setError(null);
    
    try {
      const response = await fetch('/api/aws/discover', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        // Refresh the resources list after discovery
        await fetchResources(page);
      } else {
        setError(data.error || 'Failed to discover resources');
      }
    } catch (err) {
      setError('Failed to trigger AWS discovery');
      console.error('Error triggering discovery:', err);
    } finally {
      setDiscovering(false);
    }
  };

  useEffect(() => {
    fetchResources(page);
  }, [page, resourceTypeFilter, regionFilter, accountFilter, starredOnlyFilter]);

  useEffect(() => {
    fetchAwsAccounts();
  }, []);

  const filteredResources = resources.filter(resource => {
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        resource.arn.toLowerCase().includes(searchLower) ||
        resource.nameTag?.toLowerCase().includes(searchLower) ||
        resource.resourceType.toLowerCase().includes(searchLower) ||
        resource.resourceState?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }
    
    // Apply active only filter
    if (activeOnlyFilter && !resource.isActive) {
      return false;
    }
    
    return true;
  });

  const openDetailsModal = (resource: AWSResource) => {
    setSelectedResource(resource);
    setDetailsModalOpen(true);
  };

  const renderOperationalMetrics = (resource: AWSResource) => {
    const items = extractOperationalMetrics(resource.operationalMetrics);
    
    if (items.length === 0) return null;

    return (
      <Stack gap="xs">
        {items.map((item: { type: string; key: string; label: string; value: string; percentage?: number }) => (
          <div key={item.key}>
            <Text size="sm" fw={500}>{item.label}</Text>
            {item.type === 'progress' ? (
              <Group gap="xs">
                <Progress value={item.percentage || 0} size="sm" style={{ flex: 1 }} />
                <Text size="xs">{item.value}</Text>
              </Group>
            ) : (
              <Text size="xs" c="dimmed">{item.value}</Text>
            )}
          </div>
        ))}
      </Stack>
    );
  };

  const renderStatusDetails = (resource: AWSResource) => {
    const items = extractStatusDetails(resource.statusDetails);
    
    if (items.length === 0) return null;

    return (
      <Grid>
        {items.map((item: { label: string; value: any }, index: number) => (
          <Grid.Col span={6} key={index}>
            <Text size="sm" fw={500}>{item.label}</Text>
            <Text size="xs" c="dimmed">{item.value}</Text>
          </Grid.Col>
        ))}
      </Grid>
    );
  };

  // Calculate summary stats
  const activeCount = resources.filter(r => r.isActive).length;
  const healthyCount = resources.filter(r => r.healthStatus === 'healthy').length;
  const unhealthyCount = resources.filter(r => r.healthStatus === 'unhealthy').length;
  const starredCount = resources.filter(r => r.isStarred).length;

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group align="center">
            <IconCloud size={32} />
            <Title order={1}>AWS Resources</Title>
          </Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={triggerDiscovery}
            loading={discovering}
            variant="filled"
          >
            Discover Resources
          </Button>
        </Group>

        {/* Summary Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
            <Card withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">Total Resources</Text>
                  <Text fw={700} size="xl">{totalCount}</Text>
                </div>
                <ThemeIcon color="blue" size="lg" radius="md">
                  <IconCloud size={22} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
            <Card withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">Starred</Text>
                  <Text fw={700} size="xl" c="yellow">{starredCount}</Text>
                </div>
                <ThemeIcon color="yellow" size="lg" radius="md">
                  <IconStarFilled size={22} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
            <Card withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">Active</Text>
                  <Text fw={700} size="xl" c="green">{activeCount}</Text>
                </div>
                <ThemeIcon color="green" size="lg" radius="md">
                  <IconActivity size={22} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
            <Card withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">Healthy</Text>
                  <Text fw={700} size="xl" c="green">{healthyCount}</Text>
                </div>
                <ThemeIcon color="green" size="lg" radius="md">
                  <IconCircleCheck size={22} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
            <Card withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">Unhealthy</Text>
                  <Text fw={700} size="xl" c="red">{unhealthyCount}</Text>
                </div>
                <ThemeIcon color="red" size="lg" radius="md">
                  <IconCircleX size={22} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="end" wrap="wrap">
              <Group wrap="wrap">
                <Select
                  label="Resource Type"
                  placeholder="All types"
                  data={[
                    { value: '', label: 'All types' },
                    ...AWS_RESOURCE_TYPES.map(type => ({ value: type, label: type }))
                  ]}
                  value={resourceTypeFilter}
                  onChange={(value) => setResourceTypeFilter(value || '')}
                  clearable
                  style={{ minWidth: 200 }}
                />
                <Select
                  label="Region"
                  placeholder="All regions"
                  data={[
                    { value: '', label: 'All regions' },
                    ...AWS_REGIONS.map(region => ({ value: region, label: region }))
                  ]}
                  value={regionFilter}
                  onChange={(value) => setRegionFilter(value || '')}
                  clearable
                  style={{ minWidth: 150 }}
                />
                <Select
                  label="Account"
                  placeholder="All accounts"
                  data={[
                    { value: '', label: 'All accounts' },
                    ...awsAccounts.map(account => ({ value: account.accountName, label: account.accountName }))
                  ]}
                  value={accountFilter}
                  onChange={(value) => setAccountFilter(value || '')}
                  clearable
                  style={{ minWidth: 150 }}
                />
                <TextInput
                  label="Search"
                  placeholder="Search by ARN, name, type, or state..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.currentTarget.value)}
                  style={{ minWidth: 280 }}
                />
              </Group>
              <Group align="end" gap="md">
                <Switch
                  label="Active only"
                  checked={activeOnlyFilter}
                  onChange={(event) => setActiveOnlyFilter(event.currentTarget.checked)}
                />
                <Switch
                  label="Starred only"
                  checked={starredOnlyFilter}
                  onChange={(event) => setStarredOnlyFilter(event.currentTarget.checked)}
                />
                <Text size="sm" c="dimmed">
                  {totalCount} resources found
                </Text>
              </Group>
            </Group>
          </Stack>
        </Paper>

        <Paper withBorder pos="relative">
          <LoadingOverlay visible={loading} />
          
          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ minWidth: 140 }}>Resource Type</Table.Th>
                  <Table.Th style={{ minWidth: 120 }}>Name</Table.Th>
                  <Table.Th style={{ minWidth: 100 }}>Status</Table.Th>
                  <Table.Th style={{ minWidth: 80 }}>Health</Table.Th>
                  <Table.Th style={{ minWidth: 100 }}>Region</Table.Th>
                  <Table.Th style={{ minWidth: 120 }}>Account</Table.Th>
                  <Table.Th style={{ minWidth: 120 }}>Last Checked</Table.Th>
                  <Table.Th style={{ minWidth: 80 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredResources.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={8}>
                      <Text ta="center" c="dimmed" py="xl">
                        {loading ? 'Loading...' : 'No AWS resources found. Try discovering resources first.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredResources.map((resource) => (
                    <Table.Tr key={resource.id}>
                      <Table.Td>
                        <Group gap="xs">
                          <ThemeIcon 
                            color={getResourceTypeColor(resource.resourceType)} 
                            variant="light" 
                            size="sm"
                          >
                            {getResourceTypeIcon(resource.resourceType)}
                          </ThemeIcon>
                          <Badge 
                            color={getResourceTypeColor(resource.resourceType)} 
                            variant="light"
                            size="sm"
                            style={{ maxWidth: 100 }}
                          >
                            <Text truncate size="xs">
                              {resource.resourceType.split('::')[1]}
                            </Text>
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <Text fw={500} size="sm" style={{ maxWidth: 110 }} truncate>
                            {resource.nameTag || 'Unnamed'}
                          </Text>
                          {resource.isActive !== undefined && (
                            <Badge 
                              size="xs" 
                              color={resource.isActive ? 'green' : 'red'} 
                              variant="dot"
                            >
                              {resource.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        {resource.resourceState ? (
                          <Badge 
                            color={getResourceStateColor(resource.resourceState)} 
                            variant="light" 
                            size="sm"
                          >
                            {resource.resourceState}
                          </Badge>
                        ) : (
                          <Text size="xs" c="dimmed">Unknown</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {getHealthStatusIcon(resource.healthStatus)}
                          <Text size="xs" c="dimmed">
                            {resource.healthStatus || 'Unknown'}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline" size="xs">
                          {resource.awsRegion}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed" style={{ maxWidth: 110 }} truncate>
                          {resource.accountName || 'Unknown'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <Text size="xs" c="dimmed">
                            {resource.statusLastChecked 
                              ? new Date(resource.statusLastChecked).toLocaleDateString()
                              : 'Never'
                            }
                          </Text>
                          {resource.statusLastChecked && (
                            <Text size="xs" c="dimmed">
                              {new Date(resource.statusLastChecked).toLocaleTimeString()}
                            </Text>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label={resource.isStarred ? 'Unstar' : 'Star'}>
                            <ActionIcon 
                              variant="light" 
                              size="sm"
                              color={resource.isStarred ? 'yellow' : 'gray'}
                              onClick={() => toggleStarred(resource.id, resource.isStarred)}
                            >
                              {resource.isStarred ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                            </ActionIcon>
                          </Tooltip>
                          <ActionIcon 
                            variant="light" 
                            size="sm"
                            onClick={() => openDetailsModal(resource)}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>

        {totalPages > 1 && (
          <Group justify="center">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}
      </Stack>

      {/* Resource Details Modal */}
      <Modal
        opened={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={
          <Group>
            <ThemeIcon 
              color={selectedResource ? getResourceTypeColor(selectedResource.resourceType) : 'gray'} 
              variant="light"
            >
              {selectedResource && getResourceTypeIcon(selectedResource.resourceType)}
            </ThemeIcon>
            <div>
              <Text fw={600}>{selectedResource?.nameTag || 'Unnamed Resource'}</Text>
              <Text size="sm" c="dimmed">{selectedResource?.resourceType}</Text>
            </div>
          </Group>
        }
        size="lg"
      >
        {selectedResource && (
          <Stack gap="md">
            <Card withBorder>
              <Stack gap="sm">
                <Text fw={600} size="sm">Resource Information</Text>
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>ARN</Text>
                    <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                      {selectedResource.arn}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Account ID</Text>
                    <Text size="xs" c="dimmed">{selectedResource.awsAccountId}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Account Name</Text>
                    <Text size="xs" c="dimmed">{selectedResource.accountName || 'Unknown'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Region</Text>
                    <Text size="xs" c="dimmed">{selectedResource.awsRegion}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>First Discovered</Text>
                    <Text size="xs" c="dimmed">
                      {new Date(selectedResource.firstDiscoveredAt).toLocaleString()}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Starred</Text>
                    <Badge 
                      color={selectedResource.isStarred ? 'yellow' : 'gray'} 
                      variant="light" 
                      size="sm"
                      leftSection={selectedResource.isStarred ? <IconStarFilled size={12} /> : <IconStar size={12} />}
                    >
                      {selectedResource.isStarred ? 'Yes' : 'No'}
                    </Badge>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>

            {selectedResource.statusDetails && (
              <Card withBorder>
                <Stack gap="sm">
                  <Text fw={600} size="sm">Status Details</Text>
                  {renderStatusDetails(selectedResource)}
                </Stack>
              </Card>
            )}

            {selectedResource.operationalMetrics && (
              <Card withBorder>
                <Stack gap="sm">
                  <Text fw={600} size="sm">Operational Metrics</Text>
                  {renderOperationalMetrics(selectedResource)}
                </Stack>
              </Card>
            )}

            {selectedResource.allTags && Object.keys(selectedResource.allTags).length > 0 && (
              <Card withBorder>
                <Stack gap="sm">
                  <Text fw={600} size="sm">Tags</Text>
                  <Group gap="xs">
                    {Object.entries(selectedResource.allTags).map(([key, value]) => (
                      <Badge key={key} variant="outline" size="sm">
                        {key}: {value}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              </Card>
            )}
          </Stack>
        )}
      </Modal>
    </Container>
  );
} 
