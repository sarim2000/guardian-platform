'use client';

import { useState, useEffect } from 'react';
import { Container, Stack, Title, Group, Select, Loader, Alert, Box, Text } from '@mantine/core';
import { IconMessageCircle, IconAlertCircle } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import { ChatInterface } from '@/components/chat/ChatInterface';

export function ChatPageClient() {
  const searchParams = useSearchParams();
  
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [repositories, setRepositories] = useState<string[]>([]);

  const [selectedOrg, setSelectedOrg] = useState<string | null>(searchParams.get('org'));
  const [selectedRepo, setSelectedRepo] = useState<string | null>(searchParams.get('repo'));

  const [orgLoading, setOrgLoading] = useState(true);
  const [repoLoading, setRepoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch organizations
  useEffect(() => {
    async function fetchOrgs() {
      try {
        const response = await fetch('/api/organizations');
        if (!response.ok) throw new Error('Failed to load organizations');
        const data = await response.json();
        setOrganizations(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setOrgLoading(false);
      }
    }
    fetchOrgs();
  }, []);

  // Fetch repositories when organization changes
  useEffect(() => {
    async function fetchRepos() {
      if (!selectedOrg) {
        setRepositories([]);
        setSelectedRepo(null);
        return;
      }

      setRepoLoading(true);
      setRepositories([]);
      try {
        const response = await fetch(`/api/repositories?org=${encodeURIComponent(selectedOrg)}`);
        if (!response.ok) throw new Error('Failed to load repositories');
        const data = await response.json();
        setRepositories(data);
        
        if (data.length === 1) {
          setSelectedRepo(data[0]);
        } else {
          // If a repo is in the URL but the org is changed, we might need to clear it
          // For now, we clear it unless it's a valid option.
          const currentRepoIsValid = data.includes(selectedRepo);
          if (!currentRepoIsValid) {
            setSelectedRepo(null);
          }
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setRepoLoading(false);
      }
    }
    fetchRepos();
  }, [selectedOrg]);

  return (
    <Container size="lg" py="xl" style={{ height: 'calc(100vh - 120px)' }}>
      <Stack h="100%">
        <Group>
          <IconMessageCircle size={32} />
          <Title order={2}>Chat with Documentation</Title>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
            {error}
          </Alert>
        )}

        <Group grow>
          <Select
            label="Organization"
            placeholder="Select an organization"
            data={organizations}
            value={selectedOrg}
            onChange={setSelectedOrg}
            disabled={orgLoading}
            searchable
            rightSection={orgLoading ? <Loader size="xs" /> : null}
          />
          <Select
            label="Repository"
            placeholder={selectedOrg ? "Select a repository" : "Select an organization first"}
            data={repositories}
            value={selectedRepo}
            onChange={setSelectedRepo}
            disabled={!selectedOrg || repoLoading}
            searchable
            rightSection={repoLoading ? <Loader size="xs" /> : null}
          />
        </Group>
        
        <Box style={{ flex: 1, minHeight: 0 }}>
          {selectedOrg && selectedRepo ? (
            <ChatInterface 
              service={null} // No specific service context on this page
              organizationName={selectedOrg} 
              repositoryName={selectedRepo} 
            />
          ) : (
            <Stack align="center" justify="center" h="100%" c="dimmed">
              <IconMessageCircle size={48} />
              <Text>Please select an organization and repository to begin.</Text>
            </Stack>
          )}
        </Box>
      </Stack>
    </Container>
  );
} 
