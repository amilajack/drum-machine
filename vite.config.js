import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import palette from "@palette.dev/plugin-vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    palette({
      key: process.env.PALETTE_ASSET_KEY,
      outputPath: "dist/assets",
    }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemapPathTransform: (relativeSourcePath, sourcemapPath) =>
          path.relative(
            process.cwd(),
            path.resolve(path.dirname(sourcemapPath), relativeSourcePath)
          ),
      },
    },
  },
});
