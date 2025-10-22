import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import cesium from "vite-plugin-cesium";
export default defineConfig({
  plugins: [tailwindcss(), cesium()],
});
