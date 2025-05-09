import type { NextConfig } from "next";
import webpack from "webpack";

const allowedOrigin =
  process.env.NODE_ENV === "production"
    ? new URL(process.env.NEXTAUTH_URL!).origin // esto incluye https://
    : "http://localhost:3000";

const nextConfig: NextConfig = {
  allowedDevOrigins: [allowedOrigin],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignorar módulos problemáticos en el bundle del servidor
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(node-pre-gyp|@mapbox\/node-pre-gyp|aws-sdk|mock-aws-s3|nock|node-gyp|npm)$/,
        })
      );
    }
    // Agregar loader para archivos .html
    config.module.rules.push({
      test: /\.html$/,
      use: "raw-loader",
    });
    return config;
  },
};

export default nextConfig;
