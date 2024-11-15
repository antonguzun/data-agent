'use client';
import { Config } from '@/config';
import { createContext, ReactNode } from 'react';
import getConfig from 'next/config';

export const ConfigContext = createContext<Config | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
  config: Partial<Config>;
}

export const ConfigProvider = ({ children, config }: ConfigProviderProps) => {
  const runtimeConfig = getConfig()?.experimental?.runtimeConfig?.public || {};
  
  const mergedConfig: Config = {
    ...config,
    ...runtimeConfig
  };

  return (
    <ConfigContext.Provider value={mergedConfig}>
      {children}
    </ConfigContext.Provider>
  );
};
