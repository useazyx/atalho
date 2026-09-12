import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// A API do Atalho roda na 3337 e já responde em /api, então o proxy só repassa (sem reescrever o caminho).
// Os links curtos em si (localhost:3337/abc1234) são abertos direto na API, não passam pelo front.
const API_TARGET = "http://localhost:3337"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5177,
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
})
