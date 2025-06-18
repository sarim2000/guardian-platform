'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  Text,
  Badge,
  Group,
  Title,
  Stack,
  Button,
  Loader,
  Alert,
  Breadcrumbs,
  Anchor,
  Box,
  Accordion,
} from '@mantine/core';
import { IconAlertCircle, IconExternalLink, IconHome, IconBook, IconCheck, IconMessageCircle, IconHierarchy } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DependencyGraph } from '@/components/DependencyGraph';
import { ChatModal } from '@/components/ChatModal';
import { Service } from '@/types/service';

export default function CatalogPage() {
  const params = useParams();
  const catalogName = decodeURIComponent(params.catalog as string);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, [catalogName]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/services/catalog/${encodeURIComponent(catalogName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const data = await response.json();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async (service: Service) => {
    setIngesting(service.id);
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: service.serviceName,
          organizationName: service.organizationName,
          repositoryName: service.repositoryName,
          manifestPath: service.manifestPath,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to ingest documentation');
      }

      // Show success message or update UI as needed
    } catch (error) {
      console.error('Ingestion error:', error);
      // Show error message
    } finally {
      setIngesting(null);
    }
  };

  const getLifecycleColor = (lifecycle: string) => {
    const colors: { [key: string]: string } = {
      development: 'blue',
      beta: 'yellow',
      production: 'green',
      deprecated: 'orange',
      retired: 'red',
    };
    return colors[lifecycle.toLowerCase()] || 'gray';
  };

  const breadcrumbItems = [
    { title: 'Home', href: '/', icon: <IconHome size={14} /> },
    { title: catalogName, href: '#' },
  ].map((item, index) => (
    <Anchor
      key={index}
      component={Link}
      href={item.href}
      c={item.href === '#' ? 'dimmed' : undefined}
      style={{ textDecoration: 'none' }}
    >
      <Group gap="xs">
        {item.icon}
        <span>{item.title}</span>
      </Group>
    </Anchor>
  ));

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading services...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack>
        <Breadcrumbs>{breadcrumbItems}</Breadcrumbs>

        <Group justify="space-between">
          <Stack gap={0}>
            <Title order={1}>{catalogName}</Title>
            <Text c="dimmed" size="lg">
              {services.length} service{services.length !== 1 ? 's' : ''}
            </Text>
          </Stack>
        </Group>

        {services.some(service => service.dependencies && service.dependencies.length > 0) && (
          <Accordion variant="contained">
            <Accordion.Item value="dependencies">
              <Accordion.Control icon={<IconHierarchy size={16} />}>
                Service Dependencies Graph
              </Accordion.Control>
              <Accordion.Panel>
                <DependencyGraph 
                  services={services.filter(service => service.dependencies && service.dependencies.length > 0)}
                />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        )}

        <Grid>
          {services.map((service) => (
            <Grid.Col key={service.id} span={{ base: 12, sm: 6, lg: 6 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={500} size="lg">
                      {service.displayName || service.serviceName}
                    </Text>
                    <Badge color={getLifecycleColor(service.lifecycle)}>
                      {service.lifecycle}
                    </Badge>
                  </Group>

                  {service.description && (
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {service.description}
                    </Text>
                  )}

                  <Group gap="xs">
                    {service.tier && (
                      <Badge variant="outline" color="blue">
                        {service.tier}
                      </Badge>
                    )}
                    {service.serviceType && (
                      <Badge variant="outline" color="grape">
                        {service.serviceType}
                      </Badge>
                    )}
                  </Group>

                  {service.techStack && service.techStack.length > 0 && (
                    <Group gap="xs">
                      {service.techStack.map((tech, index) => (
                        <Badge key={index} size="sm" variant="dot">
                          {tech}
                        </Badge>
                      ))}
                    </Group>
                  )}

                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      Team:
                    </Text>
                    <Text size="sm">{service.ownerTeam}</Text>
                  </Group>

                  <Stack gap="xs">
                    <Box pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                      <Button
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
                        size="sm"
                        fullWidth
                        leftSection={<IconBook size={16} />}
                        onClick={() => handleIngest(service)}
                        loading={ingesting === service.id}
                        fw={600}
                        style={{
                          boxShadow: '0 4px 12px rgba(0, 100, 200, 0.3)',
                          transform: ingesting === service.id ? 'scale(0.98)' : 'scale(1)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {ingesting === service.id ? 'Ingesting...' : 'Ingest Documentation'}
                      </Button>
                    </Box>

                    <Button
                      component={Link}
                      href={`/chat?org=${service.organizationName}&repo=${service.repositoryName}&service=${service.serviceName}`}
                      variant="filled"
                      color="violet"
                      size="sm"
                      fullWidth
                      leftSection={<IconMessageCircle size={16} />}
                      fw={500}
                      style={{
                        boxShadow: '0 2px 8px rgba(139, 69, 255, 0.3)',
                      }}
                    >
                      Chat with Docs
                    </Button>
                  </Stack>

                  {service.links && service.links.length > 0 && (
                    <Group gap="xs" mt="xs">
                      {service.links.map((link, index) => (
                        <Button
                          key={index}
                          variant="light"
                          size="xs"
                          component="a"
                          href={link.url}
                          target="_blank"
                          leftSection={<IconExternalLink size={14} />}
                        >
                          {link.name}
                        </Button>
                      ))}
                    </Group>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
} 
