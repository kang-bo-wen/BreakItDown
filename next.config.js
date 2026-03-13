/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // 优化编译性能
    workerThreads: false,
    cpus: 1,
    // 启用服务器启动钩子（用于自动入库模板）
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
  // 性能优化
  compress: true,
  poweredByHeader: false,
  // 优化开发服务器
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
