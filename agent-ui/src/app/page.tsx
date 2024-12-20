import { getServerConfig } from '@/config';
import { ConfigProvider } from '@/providers/ConfigProvider';
import ChatInterface from '@/components/chat/ChatInterface';


export default function Home() {
  const config = getServerConfig();

  return (
    <>
      <ConfigProvider config={config}>
        <ChatInterface />
      </ConfigProvider>
    </>
  );
}