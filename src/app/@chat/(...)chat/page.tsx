'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { ChatModal } from '@/components/ChatModal';
import { Service } from '@/types/service';
import { Suspense, useEffect, useState } from 'react';

function InterceptingChatModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const org = searchParams.get('org');
  const repo = searchParams.get('repo');
  const serviceName = searchParams.get('service');

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  // Create a temporary service object for instant modal display
  const tempService: Service | null = org && repo ? {
    id: `${org}-${repo}`,
    organizationName: org,
    repositoryName: repo,
    manifestPath: '',
    serviceName: serviceName || repo,
    displayName: serviceName || repo,
    ownerTeam: 'Loading...',
    lifecycle: '...',
  } : null;

  useEffect(() => {
    if (!org || !repo) {
      setLoading(false);
      return;
    }

    async function fetchServiceDetails() {
      try {
        let url = `/api/services/details?org=${encodeURIComponent(org!)}&repo=${encodeURIComponent(repo!)}`;
        if (serviceName) {
          url += `&service=${encodeURIComponent(serviceName)}`;
        }
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setService(data);
        } else {
          // If fetch fails, we'll just stick with the tempService
          console.warn('Could not fetch full service details, using fallback data.');
          setService(tempService);
        }
      } catch (e) {
        console.error("Failed to fetch service details:", e);
        setService(tempService);
      } finally {
        setLoading(false);
      }
    }

    fetchServiceDetails();
  }, [org, repo, serviceName]);
  
  const serviceToRender = loading ? tempService : service;

  return (
    <ChatModal
      opened={true}
      onClose={() => router.back()}
      service={serviceToRender}
    />
  );
}

export default function InterceptedChatPage() {
  return (
    <Suspense fallback={null}>
      <InterceptingChatModal />
    </Suspense>
  )
} 
