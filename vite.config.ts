import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Served by evpp-server under Flask's default static path (/static/).
  // The voter.html template loads scripts/voter.js + styles/voter.css, and the
  // CSS references fonts at /static/assets/*, so emit a matching layout with
  // stable (un-hashed) filenames that can be copied straight into app/static/.
  base: '/static/',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'scripts/voter.js',
        chunkFileNames: 'scripts/[name].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? '';
          if (name.endsWith('.css')) return 'styles/voter.css';
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
