/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },

  async rewrites() {
    const phpBackend = process.env.NEXT_PUBLIC_PHP_API_URL || 'https://kpl.projuktisoft.com';
    return [
      {
        source: '/api/:path*.php',
        destination: `${phpBackend}/api/:path*.php`,
      },
      {
        source: '/api/:path*.php/:query*',
        destination: `${phpBackend}/api/:path*.php/:query*`,
      },
    ];
  },
};

module.exports = nextConfig;
