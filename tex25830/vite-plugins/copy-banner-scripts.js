import fs from 'fs';
import path from 'path';

/**
 * Vite plugin to copy banner JavaScript files that aren't bundled
 * This handles scripts loaded with <script src="..."> without type="module"
 */
export default function copyBannerScripts() {
  return {
    name: 'copy-banner-scripts',
    writeBundle(options, bundle) {
      // Get the output directory
      const outDir = options.dir || 'dist';
      
      // For each HTML file in the bundle, find and copy its script
      Object.entries(bundle).forEach(([fileName, info]) => {
        if (fileName.endsWith('.html')) {
          // Extract banner name from path (e.g., "banners/970x90/index.html" -> "970x90")
          const match = fileName.match(/banners\/([^/]+)\/index\.html/);
          if (match) {
            const bannerName = match[1];
            const scriptSource = path.resolve(process.cwd(), `banners/${bannerName}/assets/js/script.js`);
            const scriptDest = path.resolve(process.cwd(), outDir, 'banners', bannerName, 'assets', 'js', 'script.js');
            
            // Check if source script exists
            if (fs.existsSync(scriptSource)) {
              // Create destination directory
              fs.mkdirSync(path.dirname(scriptDest), { recursive: true });
              
              // Copy the script file
              fs.copyFileSync(scriptSource, scriptDest);
              console.log(`✅ Copied script for ${bannerName}`);
            }
          }
        }
      });
    }
  };
}
