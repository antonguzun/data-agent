import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  const config = getServerConfig();

  return (
    <div className="container mx-auto">
      <ConfigProvider config={config}>
        <ChatInterface />
      </ConfigProvider>
    </div>
  );
}

import { getServerConfig } from '@/config';
import { ConfigProvider } from '@/providers/ConfigProvider';
