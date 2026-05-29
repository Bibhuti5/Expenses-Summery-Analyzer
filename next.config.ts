// Load the Node 25+ Web Storage shim first. Next loads this config before
// any app code, so importing here is early enough — and unlike the previous
// NODE_OPTIONS='--require …' approach, this works on Windows.
import "./node-compat.cjs";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Pin the workspace root so a stray yarn.lock or package.json elsewhere
  // on the learner's machine can't hijack Turbopack's module resolution.
  turbopack: { root: process.cwd() },

  // ─── Netlify / OpenNext compatibility ────────────────────────────────────
  // Netlify uses the OpenNext adapter which handles SSR, ISR, Middleware, and
  // Image Optimization automatically. The settings below are recommended by
  // https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/

  // Skew Protection: keeps clients on the same deployment version.
  // Only needed for Next.js < 14.1.4. Safe to leave on for all versions.
  experimental: {
    useDeploymentId: true,
    useDeploymentIdServerActions: true,
  },

  // Allow Netlify Image CDN to serve optimised images.
  images: {
    // Add any external image domains your app uses, e.g.:
    // domains: ["lh3.googleusercontent.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile pictures (Gmail OAuth)
      },
    ],
  },
};

export default nextConfig;
