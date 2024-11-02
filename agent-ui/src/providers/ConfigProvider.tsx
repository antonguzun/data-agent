'use client';
import { Config } from '@/config';
import { createContext, ReactNode } from 'react';

export const ConfigContext = createContext<Config | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
  config: Config;
}

export const ConfigProvider = ({ children, config }: ConfigProviderProps) => {
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
};
