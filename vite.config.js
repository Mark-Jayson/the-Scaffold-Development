import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Two pages: the 3D moonbase at / and the Scaffold mobile app at /app/.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app/index.html', import.meta.url)),
      },
    },
  },
});
