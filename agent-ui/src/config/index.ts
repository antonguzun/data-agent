export interface Config {
  agentUrl: string;
}

export const getServerConfig = (): Config => ({
  agentUrl: process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8001'
});
