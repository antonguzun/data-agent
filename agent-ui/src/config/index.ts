export interface Config {
  agentApiUrl: string;
}

export const getServerConfig = (): Config => ({
  agentApiUrl: process.env.NEXT_PUBLIC_AGENT_API_URL || 'localhost:8000',
});
