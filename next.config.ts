import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Required so Next.js binds to Railway's dynamic $PORT
  // Railway sets PORT automatically; Next.js reads it via next start -p $PORT
  output: "standalone",
};

export default nextConfig;
