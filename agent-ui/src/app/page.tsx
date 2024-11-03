import Link from 'next/link';
import { Metadata } from 'next';
import Header from '@/components/menu/header';
import Footer from '@/components/menu/footer';
import { SearchField } from '@/components/search/SearchField';

export default function Home() {
  const config = getServerConfig();
  
  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* <Header /> */}
      <div className="flex-grow flex items-center justify-center w-full px-4">
        <ConfigProvider config={config}>
          <SearchField />
        </ConfigProvider>
      </div>
      <Footer />
    </main>
  );
}

import { getServerConfig } from '@/config';
import { ConfigProvider } from '@/providers/ConfigProvider';
