/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Force dynamic rendering for API routes
    appDir: true,
  },
  // Disable static optimization for API routes
  output: 'standalone',
};

export default nextConfig;
