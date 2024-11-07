import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  const config = getServerConfig();

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <ConfigProvider config={config}>
        <ChatInterface />
      </ConfigProvider>

    </div>
  );
}

import { getServerConfig } from '@/config';
import { ConfigProvider } from '@/providers/ConfigProvider';
