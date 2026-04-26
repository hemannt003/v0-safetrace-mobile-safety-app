/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: true },
  images: { domains: ['maps.googleapis.com'] },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Permissions-Policy', value: 'microphone=(), geolocation=()' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
  ],
};
module.exports = nextConfig;
