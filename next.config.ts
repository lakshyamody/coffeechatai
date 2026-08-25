import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    // next/image refuses remote hosts unless they're declared. The scroll
    // hero renders its media and backdrop from these.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "me7aitdbxq.ufs.sh" },
    ],
  },
};

export default nextConfig;
