/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtimeConfig: {
      public: {
        agentApiUrl: process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3000',
        environment: process.env.NODE_ENV || 'development'
      }
    }
  }
};

export default nextConfig;
