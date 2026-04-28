import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";
import injectBannerControls from "./vite-plugins/inject-banner-controls.js";
import copyBannerScripts from "./vite-plugins/copy-banner-scripts.js";
import viteImagemin from "@vheemstra/vite-plugin-imagemin";
import imageminGifsicle from "imagemin-gifsicle";
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminPngquant from "imagemin-pngquant";
import imageminSvgo from "imagemin-svgo";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get target banner from environment variable or command line argument
const targetBanner =
  process.env.BANNER ||
  process.argv.find((arg) => arg.startsWith("--banner="))?.split("=")[1];

// Find all banner directories
const allBannerDirs = glob.sync("banners/*/index.html").map((file) => {
  const dir = file.replace("/index.html", "");
  const name = dir.replace("banners/", "");
  return {
    name,
    path: resolve(__dirname, file),
    dir: resolve(__dirname, dir),
  };
});

// Filter banners based on target
const bannerDirs = targetBanner
  ? allBannerDirs.filter((banner) => banner.name === targetBanner)
  : allBannerDirs;

if (targetBanner && bannerDirs.length === 0) {
  console.error(`❌ Banner "${targetBanner}" not found. Available banners:`);
  allBannerDirs.forEach((banner) => console.log(`  - ${banner.name}`));
  process.exit(1);
}

// Create input object for multi-page build
const input = bannerDirs.reduce((acc, banner) => {
  acc[banner.name] = banner.path;
  return acc;
}, {});

// For development of a single banner, set the root to the banner directory
const isDev = process.env.NODE_ENV !== "production";
const singleBannerDev = isDev && targetBanner && bannerDirs.length === 1;

export default defineConfig({
  plugins: [
    injectBannerControls(),
    copyBannerScripts(),
    viteImagemin({
      plugins: {
        png: imageminPngquant({
          quality: [0.7, 0.9],
          speed: 4,
        }),
        jpg: imageminMozjpeg({
          quality: 80,
        }),
        gif: imageminGifsicle({
          optimizationLevel: 3,
        }),
        svg: imageminSvgo({
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  removeViewBox: false,
                },
              },
            },
          ],
        }),
      },
    }),
  ],
  root: singleBannerDev ? bannerDirs[0].dir : ".",
  base: "./",
  build: {
    rollupOptions: {
      input: singleBannerDev ? resolve(bannerDirs[0].dir, "index.html") : input,
      output: {
        dir: "_review",
        entryFileNames: "[name]/index.js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    outDir: "_review",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: singleBannerDev ? "/" : true,
  },
  css: {
    postcss: "./postcss.config.js",
  },
});
