import { resolve } from 'node:path'
import type { NextConfig } from 'next'

const jcRoot = resolve(import.meta.dirname, '..')

const nextConfig: NextConfig = {
  transpilePackages: ['jc'],
  webpack(config) {
    // Resolve jc subpath exports explicitly — transpilePackages bypasses the exports map
    config.resolve.alias = {
      ...config.resolve.alias,
      'jc/advanced': resolve(jcRoot, 'dist/advanced.js'),
      'jc/config': resolve(jcRoot, 'dist/config.js'),
      'jc/next': resolve(jcRoot, 'dist/next.js'),
    }
    return config
  },
}

export default nextConfig
