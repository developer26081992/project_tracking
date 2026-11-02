/** @type {import('next').NextConfig} */
module.exports = {
  experimental: { serverActions: true },
  webpack(config, { nextRuntime }) {
    if (nextRuntime === 'edge') {
      // Next 13's inner-graph optimizer can prune parent constructors used by
      // Clerk's authentication bundle, producing classes that extend null.
      config.optimization.innerGraph = false;
    }
    return config;
  },
};
