import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The OG cards read Geist from disk. Every card is prerendered, but a robot
  // added between deploys renders on demand, so the font has to be traced into
  // the serverless bundle too.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/lib/og-fonts/*.ttf"],
    "/robots/[slug]/opengraph-image": ["./src/lib/og-fonts/*.ttf"],
  },
};

export default nextConfig;
