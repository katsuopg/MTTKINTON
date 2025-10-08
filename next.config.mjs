/** @type {import('next').NextConfig} */
const nextConfig = {
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