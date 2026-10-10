import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Saat `npm run dev`, request /api diteruskan ke backend lokal (port 3000).
// Di Vercel, /api dilayani oleh api/index.js pada domain yang sama.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3000" },
  },
});
