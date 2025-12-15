import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/comidasperiodicas/", // <- nombre exacto del repositorio
});
