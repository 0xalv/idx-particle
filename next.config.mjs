/** @type {import('next').NextConfig} */
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  swcMinify: true,
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["app.indexcoop.com"],
  },
  // Optimize chunks and code splitting
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          minSize: 20000,
          maxSize: 100000,
          cacheGroups: {
            // Optimize Ant Design bundles
            antd: {
              test: /[\\/]node_modules[\\/]antd[\\/]/,
              name: "antd",
              priority: 10,
              reuseExistingChunk: true,
            },
            // Optimize Lottie animations
            lottie: {
              test: /[\\/]node_modules[\\/]lottie.*[\\/]/,
              name: "lottie",
              priority: 9,
              reuseExistingChunk: true,
            },
            // Vendor chunk for other large dependencies
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: 8,
              reuseExistingChunk: true,
            },
          },
        },
        moduleIds: "deterministic",
        chunkIds: "deterministic",
      };
    }

    return config;
  },

  experimental: {
    // optimizeCss: true,
    // workerThreads: true,
    craCompat: false,
    optimizePackageImports: ["antd"],
  },
};

export default withBundleAnalyzer(nextConfig);
