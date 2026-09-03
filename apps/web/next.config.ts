import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  transpilePackages: ['@platform/ui', '@platform/types', '@platform/validation', '@platform/config'],
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
