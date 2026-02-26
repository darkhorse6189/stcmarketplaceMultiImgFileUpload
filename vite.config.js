import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // FIXED: Empty string for Spring Boot
  base: '',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  
  // For development with proxy

})