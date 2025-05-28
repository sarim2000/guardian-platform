'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Card,
  Text,
  Group,
  Title,
  Stack,
  Loader,
  Alert,
  SimpleGrid,
  ThemeIcon,
  rem,
  Anchor,
} from '@mantine/core';
import { IconAlertCircle, IconApps, IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';

interface Service {
  id: string;
  serviceName: string;
  partOf?: string;
}

interface Catalog {
  name: string;
  serviceCount: number;
}

export default function HomePage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const services: Service[] = await response.json();
      
      // Group services by partOf and count them
      const catalogMap = new Map<string, number>();
      services.forEach(service => {
        const catalog = service.partOf || 'Uncategorized';
        catalogMap.set(catalog, (catalogMap.get(catalog) || 0) + 1);
      });

      // Convert to array of Catalog objects
      const catalogArray: Catalog[] = Array.from(catalogMap.entries()).map(([name, count]) => ({
        name,
        serviceCount: count,
      }));

      // Sort by name, but keep Uncategorized at the end
      catalogArray.sort((a, b) => {
        if (a.name === 'Uncategorized') return 1;
        if (b.name === 'Uncategorized') return -1;
        return a.name.localeCompare(b.name);
      });

      setCatalogs(catalogArray);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading catalogs...</Text>
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
        <Title order={1}>Service Catalogs</Title>
        <Text c="dimmed" size="lg">
          Browse our service catalogs to discover and learn about our various systems and platforms.
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {catalogs.map((catalog) => (
            <Link 
              key={catalog.name} 
              href={`/catalog/${encodeURIComponent(catalog.name)}`}
              style={{ textDecoration: 'none' }}
            >
              <Card 
                shadow="sm" 
                padding="lg" 
                radius="md" 
                withBorder
                h={180}
              >
                <Stack h="100%" justify="space-between">
                  <Group>
                    <ThemeIcon 
                      size={rem(40)} 
                      radius="md" 
                      variant="light" 
                      color="blue"
                    >
                      <IconApps size={rem(24)} />
                    </ThemeIcon>
                    <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="lg" fw={500} lineClamp={1}>
                        {catalog.name}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {catalog.serviceCount} service{catalog.serviceCount !== 1 ? 's' : ''}
                      </Text>
                    </Stack>
                  </Group>

                  <Group justify="flex-end">
                    <Anchor component="span" c="blue">
                      View Services <IconArrowRight size={rem(14)} style={{ verticalAlign: 'middle' }} />
                    </Anchor>
                  </Group>
                </Stack>
              </Card>
            </Link>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
