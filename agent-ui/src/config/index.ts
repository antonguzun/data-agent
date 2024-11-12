export interface Config {
  agentUrl: string;
  agentWs: string;
}

export const getServerConfig = (): Config => ({
  agentUrl: process.env.NEXT_PUBLIC_AGENT_URL || 'localhost:8000',
  agentWs: process.env.NEXT_PUBLIC_AGENT_URL || 'localhost:8000'
});
