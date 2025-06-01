'use client'

import { FileTree } from '@/components/FileTree'
import { YamlViewer } from '@/components/YamlViewer'
import { SERVICE_MANIFEST_EXAMPLE, FILE_STRUCTURE_EXAMPLE } from '@/constants/examples'
import { Container, Title, Text, Stack, Paper, Code, List, Divider, Alert, Group, Badge, Anchor } from '@mantine/core'
import { IconInfoCircle, IconFolder, IconFile, IconRocket } from '@tabler/icons-react'

export default function OnboardingPage() {
  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Group gap="sm" mb="md">
            <IconRocket size={32} className="text-blue-500" />
            <Title order={1}>Onboard Your Service to Guardian</Title>
          </Group>
          <Text size="lg" c="dimmed">
            Learn how to register your service with Guardian by creating service manifests in your repository.
          </Text>
        </div>

        {/* Quick Start Alert */}
        <Alert icon={<IconInfoCircle size={16} />} title="Quick Start" color="blue">
          <Text size="sm">
            Add Guardian service manifests to your repository by creating a <Code>.guardian</Code> folder with{' '}
            <Code>{'{service-name}'}.yml</Code> files. Guardian will automatically discover and catalog your services.
          </Text>
        </Alert>

        {/* Step 1: Create .guardian folder */}
        <Paper p="xl" shadow="sm" radius="md">
          <Stack gap="md">
            <Group gap="sm">
              <IconFolder size={24} className="text-green-500" />
              <Title order={2}>Step 1: Create the .guardian Folder</Title>
            </Group>

            <Text>
              In your repository root, create a <Code>.guardian</Code> folder that will contain all your service
              manifests:
            </Text>

            <Paper p="md" bg="gray.9" radius="md" style={{ border: '1px solid #374151' }}>
              <Group gap="xs">
                <Text size="sm" c="green.4" fw={500} style={{ fontFamily: 'monospace' }}>
                  $
                </Text>
                <Text size="sm" c="gray.1" style={{ fontFamily: 'monospace' }}>
                  mkdir .guardian
                </Text>
              </Group>
            </Paper>

            <Text size="sm" c="dimmed">
              The <Code>.guardian</Code> folder is where Guardian looks for service definitions. This keeps all
              Guardian-related configuration in one place and doesn't interfere with your application code.
            </Text>
          </Stack>
        </Paper>

        {/* Step 2: Create Service Manifest */}
        <Paper p="xl" shadow="sm" radius="md">
          <Stack gap="md">
            <Group gap="sm">
              <IconFile size={24} className="text-blue-500" />
              <Title order={2}>Step 2: Create Service Manifests</Title>
            </Group>

            <Text>
              Create YAML files named after your services. Each file should follow the pattern{' '}
              <Code>{'{service-name}'}.yml</Code>:
            </Text>

            <FileTree items={FILE_STRUCTURE_EXAMPLE} />

            <Text>Each manifest file describes a single service and its metadata. Here's a complete example:</Text>

            <YamlViewer content={SERVICE_MANIFEST_EXAMPLE} title="node-service.yml - Complete Example" />
          </Stack>
        </Paper>

        {/* Step 3: Understanding the Schema */}
        <Paper p="xl" shadow="sm" radius="md">
          <Stack gap="md">
            <Title order={2}>Step 3: Understanding the Service Schema</Title>

            <Divider />

            <div>
              <Title order={4} mb="sm">
                Required Fields
              </Title>
              <List spacing="xs">
                <List.Item>
                  <Group gap="xs">
                    <Code>kind</Code>
                    <Text size="sm">Must be "Service"</Text>
                  </Group>
                </List.Item>
                <List.Item>
                  <Group gap="xs">
                    <Code>metadata.name</Code>
                    <Text size="sm">Unique identifier for your service (kebab-case recommended)</Text>
                  </Group>
                </List.Item>
                <List.Item>
                  <Group gap="xs">
                    <Code>spec.owner.team</Code>
                    <Text size="sm">Team responsible for this service</Text>
                  </Group>
                </List.Item>
                <List.Item>
                  <Group gap="xs">
                    <Code>spec.lifecycle</Code>
                    <Text size="sm">Current stage (development, beta, production, deprecated, retired)</Text>
                  </Group>
                </List.Item>
              </List>
            </div>

            <Divider />

            <div>
              <Title order={4} mb="sm">
                Optional Fields
              </Title>
              <List spacing="xs">
                <List.Item>
                  <Group gap="xs">
                    <Code>metadata.displayName</Code>
                    <Text size="sm">Human-readable name for UIs</Text>
                  </Group>
                </List.Item>
                <List.Item>
                  <Group gap="xs">
                    <Code>metadata.description</Code>
                    <Text size="sm">Brief description of what the service does</Text>
                  </Group>
                </List.Item>
                <List.Item>
                  <Group gap="xs">
                    <Code>spec.tier</Code>
                    <Text size="sm">Criticality level (tier1-tier4)</Text>
                  </Group>
                </List.Item>
                <List.Item>
                  <Group gap="xs">
                    <Code>spec.type</Code>
                    <Text size="sm">Service type (api, frontend, worker, cronjob, database, library)</Text>
                  </Group>
                </List.Item>
                <List.Item>
                  <Group gap="xs">
                    <Code>spec.techStack</Code>
                    <Text size="sm">List of technologies used</Text>
                  </Group>
                </List.Item>
                <List.Item>
                  <Group gap="xs">
                    <Code>spec.links</Code>
                    <Text size="sm">Important URLs (docs, dashboards, runbooks)</Text>
                  </Group>
                </List.Item>
              </List>
            </div>
          </Stack>
        </Paper>

        {/* Step 4: Service Types and Tiers */}
        <Paper p="xl" shadow="sm" radius="md">
          <Stack gap="md">
            <Title order={2}>Service Types & Tiers</Title>

            <div>
              <Title order={4} mb="sm">
                Service Types
              </Title>
              <Group gap="sm">
                <Badge color="blue">api</Badge>
                <Badge color="green">frontend</Badge>
                <Badge color="orange">worker</Badge>
                <Badge color="purple">cronjob</Badge>
                <Badge color="red">database</Badge>
                <Badge color="gray">library</Badge>
              </Group>
            </div>

            <div>
              <Title order={4} mb="sm">
                Service Tiers (Criticality)
              </Title>
              <List spacing="xl">
                <List.Item>
                  <Group gap="sm">
                    <Badge color="red">tier1</Badge>
                    <Text size="sm">Mission critical - outages cause immediate business impact</Text>
                  </Group>
                </List.Item>
                <List.Item>
                  <Group gap="sm">
                    <Badge color="orange">tier2</Badge>
                    <Text size="sm">Important - significant impact but workarounds exist</Text>
                  </Group>
                </List.Item>
                <List.Item>
                  <Group gap="sm">
                    <Badge color="yellow">tier3</Badge>
                    <Text size="sm">Standard - moderate impact, can wait for business hours</Text>
                  </Group>
                </List.Item>
                <List.Item>
                  <Group gap="sm">
                    <Badge color="gray">tier4</Badge>
                    <Text size="sm">Low priority - minimal impact if unavailable</Text>
                  </Group>
                </List.Item>
              </List>
            </div>
          </Stack>
        </Paper>

        {/* Step 5: Next Steps */}
        <Paper p="xl" shadow="sm" radius="md">
          <Stack gap="md">
            <Title order={2}>What Happens Next?</Title>

            <List spacing="sm">
              <List.Item>
                <Text>
                  <strong>Automatic Discovery:</strong> Guardian periodically scans repositories for .guardian folders
                </Text>
              </List.Item>
              <List.Item>
                <Text>
                  <strong>Service Cataloging:</strong> Your services will appear in the Guardian catalog
                </Text>
              </List.Item>
              <List.Item>
                <Text>
                  <strong>Dependency Mapping:</strong> Guardian analyzes service relationships
                </Text>
              </List.Item>
              <List.Item>
                <Text>
                  <strong>Health Monitoring:</strong> Optional health checks and monitoring integration
                </Text>
              </List.Item>
            </List>

            <Alert color="green" title="Pro Tip">
              <Text size="sm">
                Start with the required fields and gradually add more metadata as your service matures. You can update
                manifests anytime and Guardian will sync the changes automatically.
              </Text>
            </Alert>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
} 
