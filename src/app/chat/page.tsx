import { ChatPageClient } from '@/components/chat/ChatPageClient';
import { Suspense } from 'react';

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageClient />
    </Suspense>
  );
} 
