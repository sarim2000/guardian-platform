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
} from '@mantine/core';
import { IconRefresh, IconSearch, IconAlertCircle, IconCloud } from '@tabler/icons-react';

interface AWSResource {
  id: string;
  arn: string;
  awsAccountId: string;
  awsRegion: string;
  resourceType: string;
  nameTag?: string;
  allTags: Record<string, string>;
  firstDiscoveredAt: string;
  lastSeenAt: string;
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
  };
  error?: string;
}

export default function AWSResourcesPage() {
  const [resources, setResources] = useState<AWSResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const resourceTypes = [
    'EC2::Instance', 'EC2::Volume', 'EC2::SecurityGroup', 'EC2::VPC', 'EC2::Subnet',
    'RDS::DBInstance', 'RDS::DBCluster', 'S3::Bucket', 'Lambda::Function',
    'ECS::Cluster', 'ECS::Service', 'ECS::TaskDefinition', 'DynamoDB::Table',
    'SNS::Topic', 'SQS::Queue', 'ELB::LoadBalancer', 'ELB::TargetGroup',
    'IAM::Role', 'IAM::User', 'CloudWatchLogs::LogGroup', 'CloudWatch::Alarm',
    'Kinesis::Stream', 'OpenSearch::Domain', 'MSK::Cluster', 'Redshift::Cluster',
    'ElastiCache::Cluster', 'APIGateway::RestApi', 'Route53::HostedZone',
    'CloudFront::Distribution', 'SecretsManager::Secret', 'SSM::Parameter',
    'Glue::Database', 'Glue::Job', 'StepFunctions::StateMachine', 'Batch::JobQueue',
    'EFS::FileSystem', 'EKS::Cluster', 'ECR::Repository'
  ];
  const regions = [
    'us-east-1', 'us-west-1', 'us-west-2', 'us-east-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1',
    'ca-central-1', 'sa-east-1', 'af-south-1', 'me-south-1'
  ];

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
  }, [page, resourceTypeFilter, regionFilter]);

  const filteredResources = resources.filter(resource => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      resource.arn.toLowerCase().includes(searchLower) ||
      resource.nameTag?.toLowerCase().includes(searchLower) ||
      resource.resourceType.toLowerCase().includes(searchLower)
    );
  });

  const getResourceTypeColor = (type: string) => {
    const service = type.split('::')[0];
    switch (service) {
      case 'EC2': return 'blue';
      case 'RDS': return 'purple';
      case 'S3': return 'green';
      case 'Lambda': return 'orange';
      case 'ECS': return 'cyan';
      case 'DynamoDB': return 'yellow';
      case 'SNS': return 'pink';
      case 'SQS': return 'lime';
      case 'ELB': return 'indigo';
      case 'IAM': return 'red';
      case 'CloudWatchLogs':
      case 'CloudWatch': return 'teal';
      case 'Kinesis': return 'violet';
      case 'OpenSearch': return 'grape';
      case 'MSK': return 'dark';
      case 'Redshift': return 'blue';
      case 'ElastiCache': return 'red';
      case 'APIGateway': return 'green';
      case 'Route53': return 'orange';
      case 'CloudFront': return 'cyan';
      case 'SecretsManager': return 'pink';
      case 'SSM': return 'gray';
      case 'Glue': return 'yellow';
      case 'StepFunctions': return 'indigo';
      case 'Batch': return 'lime';
      case 'EFS': return 'teal';
      case 'EKS': return 'violet';
      case 'ECR': return 'grape';
      default: return 'gray';
    }
  };

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

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        <Paper p="md" withBorder>
          <Group justify="space-between" align="end">
            <Group>
              <Select
                label="Resource Type"
                placeholder="All types"
                data={[
                  { value: '', label: 'All types' },
                  ...resourceTypes.map(type => ({ value: type, label: type }))
                ]}
                value={resourceTypeFilter}
                onChange={(value) => setResourceTypeFilter(value || '')}
                clearable
              />
              <Select
                label="Region"
                placeholder="All regions"
                data={[
                  { value: '', label: 'All regions' },
                  ...regions.map(region => ({ value: region, label: region }))
                ]}
                value={regionFilter}
                onChange={(value) => setRegionFilter(value || '')}
                clearable
              />
              <TextInput
                label="Search"
                placeholder="Search by ARN, name, or type..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
              />
            </Group>
            <Text size="sm" c="dimmed">
              {totalCount} resources found
            </Text>
          </Group>
        </Paper>

        <Paper withBorder pos="relative">
          <LoadingOverlay visible={loading} />
          
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Resource Type</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>ARN</Table.Th>
                <Table.Th>Region</Table.Th>
                <Table.Th>Account ID</Table.Th>
                <Table.Th>Last Seen</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredResources.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed" py="xl">
                      {loading ? 'Loading...' : 'No AWS resources found. Try discovering resources first.'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredResources.map((resource) => (
                  <Table.Tr key={resource.id}>
                    <Table.Td>
                      <Badge color={getResourceTypeColor(resource.resourceType)} variant="light">
                        {resource.resourceType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>
                        {resource.nameTag || 'Unnamed'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label={resource.arn}>
                        <Text size="sm" c="dimmed" style={{ maxWidth: 300 }} truncate>
                          {resource.arn}
                        </Text>
                      </Tooltip>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="outline" size="sm">
                        {resource.awsRegion}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {resource.awsAccountId}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(resource.lastSeenAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
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
    </Container>
  );
} 
