import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lxeuiiwgnvtibyacanyp.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps in CI with auth token present
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
