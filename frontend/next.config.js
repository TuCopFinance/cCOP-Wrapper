/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ignorar el worker problemático
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      use: 'ignore-loader'
    });

    return config;
  },
  // Otras configuraciones de Next.js
  reactStrictMode: true,
  swcMinify: true
};

module.exports = nextConfig; 