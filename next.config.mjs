// Cleaned Next.js config: all Sentry integration removed.

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com'
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com'
      }
    ]
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
      '@/hooks': './src/hooks',
      '@/utils': './src/utils',
      '@/components': './src/components',
      '@/lib': './src/lib'
    };
    return config;
  }
};

export default nextConfig;
