import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  serverExternalPackages: ["playwright", "@sparticuz/chromium"]
};

export default nextConfig;
