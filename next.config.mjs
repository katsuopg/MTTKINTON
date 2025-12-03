/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: true,
    // Cross origin開発アクセスを許可
    allowedOrigins: ['192.168.1.*', 'localhost:3000']
  },
  // 開発時のCross originアクセスを許可
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' ? '*' : 'https://yourdomain.com'
          }
        ]
      }
    ];
  }
};

export default nextConfig;