import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/mermaid-editor/',
  server: {
    port: 6729,
  },
});
