import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@styles": path.resolve(__dirname, "./src/styles"),
    },
  },
  define: {
    'process.env': {},
    'global': {},
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
    include: [
      // Pre-bundle these dependencies to speed up dev server
      'react',
      'react-dom',
      'framer-motion',
      'react-hot-toast',
      '@solana/web3.js',
      '@solana/wallet-adapter-react',
      '@solana/spl-token',
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      // Ensure external dependencies are properly handled
      external: [
        // Add any external dependencies that might cause problems
      ],
    },
  },
  esbuild: {
    // Allow JSX in .js files
    jsx: 'automatic',
    jsxInject: null,
  },
});