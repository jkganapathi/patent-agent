/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      // Keep backward compatibility with AI_GATEWAY_API_KEY
      AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    },
  }
  
  module.exports = nextConfig