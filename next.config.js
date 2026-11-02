/** @type {import('next').NextConfig} */
module.exports = {
  experimental: { serverActions: true },
  webpack(config, { isServer }) {
    if (isServer) {
      // Next 13's inner-graph optimizer can prune parent constructors used by
      // Clerk's edge and Node authentication bundles, producing classes that
      // extend null. Both bundles participate in signed-in requests.
      config.optimization.innerGraph = false;
      config.optimization.concatenateModules = false;
    }
    return config;
  },
};
