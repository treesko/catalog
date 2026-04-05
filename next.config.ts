import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/export-products": ["./node_modules/pdfkit/js/data/**/*"],
  },
  serverExternalPackages: ["pdfkit", "bwip-js"],
};

export default nextConfig;
