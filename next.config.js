/** @type {import('next').NextConfig} */
const nextConfig = {
  // webpack設定
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Supabaseクライアント側の設定
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // SVGRサポート
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Supabaseモジュールの最適化設定
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };

    return config;
  },

  // Turbopack用SVGRサポート
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // サーバーコンポーネント用外部パッケージ
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // 開発環境でのクロスオリジンアクセスを許可
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
  // クロスオリジン開発を許可
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/_next/:path*',
          destination: '/_next/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;