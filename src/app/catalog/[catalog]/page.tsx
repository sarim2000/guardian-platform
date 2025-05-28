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
} from '@mantine/core';
import { IconAlertCircle, IconExternalLink, IconHome } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DependencyGraph } from '@/components/DependencyGraph';

interface ServiceLink {
  name: string;
  url: string;
}

interface Service {
  id: string;
  serviceName: string;
  displayName?: string;
  description?: string;
  ownerTeam: string;
  lifecycle: string;
  tier?: string;
  serviceType?: string;
  partOf?: string;
  links?: ServiceLink[];
  techStack?: string[];
  dependencies?: Array<{
    name: string;
    critical: boolean;
    relationship: string;
  }>;
}

export default function CatalogPage() {
  const params = useParams();
  const catalogName = decodeURIComponent(params.catalog as string);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <Container>
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

        {/* Show dependency graph only if there are services with dependencies */}
        {services.some(service => service.dependencies && service.dependencies.length > 0) && (
          <DependencyGraph 
            services={services.filter(service => service.dependencies && service.dependencies.length > 0)}
          />
        )}

        <Grid>
          {services.map((service) => (
            <Grid.Col key={service.id} span={{ base: 12, sm: 6, lg: 4 }}>
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
