import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
      },
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split heavy vendors into separate, independently-cacheable chunks so
        // they load in parallel and don't bloat the initial bundle.
        manualChunks(id) {
          // Rollup moves every *unassigned* dependency of a manual chunk into
          // that chunk. Vite's preload helper (used by every lazy() route) was
          // landing in `pdf` (jsPDF uses dynamic imports) and clsx (used by
          // cn() in the navbar) in `charts` (recharts depends on it), so the
          // entry statically imported ~1.3 MB it never ran. Pin the helpers the
          // app shell needs to the shell's vendor chunk.
          if (
            id.includes('vite/preload-helper') ||
            id.includes('commonjsHelpers') ||
            /node_modules[\\/](clsx|tailwind-merge)[\\/]/.test(id)
          ) return 'react-vendor';
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) return 'charts';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg') || id.includes('dompurify')) return 'pdf';
          if (id.includes('socket.io') || id.includes('engine.io')) return 'socket';
          if (id.includes('react-router') || id.includes('/react-dom/') || id.includes('/react/')) return 'react-vendor';
        },
      },
    },
  },
});
