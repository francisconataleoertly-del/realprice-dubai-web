import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enables the browser View Transitions API for client-side route changes
    // (Chrome/Edge stable, Safari TP, Firefox behind flag). Falls back to a
    // standard navigation when the API isn't available.
    viewTransition: true,
  },
};

export default nextConfig;
