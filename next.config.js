/**
 * next.config.js
 * Minimal config compatible with Next.js runtime.
 * Expose NGROK_URL via process.env for runtime usage if provided.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  env: {
    NGROK_URL: process.env.NGROK_URL || "",
  },
};

module.exports = nextConfig;
