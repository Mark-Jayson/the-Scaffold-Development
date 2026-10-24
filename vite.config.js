import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Three pages: the 3D moonbase at /, the Scaffold mobile app at /app/ and Scaffold Focus at /focus/.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app/index.html', import.meta.url)),
        focus: fileURLToPath(new URL('./focus/index.html', import.meta.url)),
      },
    },
  },
});
