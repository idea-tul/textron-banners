#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { glob } = require("glob");
const archiver = require("archiver");

/**
 * Deploy banners by creating zip files for distribution
 * This replaces the gulp deploy functionality
 */
class BannerDeployer {
  constructor() {
    this.deployDir = "_deploy";
    this.reviewDir = "_review";
    this.maxSizeKB = 500; // IAB limit is 200KB, using 500KB as buffer
  }

  /**
   * Ensure deploy directory exists
   */
  ensureDeployDir() {
    if (!fs.existsSync(this.deployDir)) {
      fs.mkdirSync(this.deployDir, { recursive: true });
    }
  }

  /**
   * Get file size in KB
   * @param {string} filePath
   * @returns {number}
   */
  getFileSizeKB(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size / 1024;
  }

  /**
   * Copy directory recursively
   * @param {string} src - Source directory
   * @param {string} dest - Destination directory
   */
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Extract asset references from HTML
   * @param {string} htmlContent - HTML content
   * @returns {object} - Object with css and img arrays
   */
  extractAssetReferences(htmlContent) {
    const css = [];
    const img = [];

    // Extract CSS files
    const cssRegex = /href="\.\.\/\.\.\/assets\/css\/([^"]+)"/g;
    let cssMatch;
    while ((cssMatch = cssRegex.exec(htmlContent)) !== null) {
      css.push(cssMatch[1]);
    }

    // Extract image files
    const imgRegex = /src="\.\.\/\.\.\/assets\/img\/([^"]+)"/g;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(htmlContent)) !== null) {
      img.push(imgMatch[1]);
    }

    return { css, img };
  }

  /**
   * Update HTML to use local asset paths
   * @param {string} htmlContent - HTML content
   * @returns {string} - Updated HTML content
   */
  updateAssetPaths(htmlContent) {
    // Update CSS paths from ../../assets/css/ to assets/css/
    htmlContent = htmlContent.replace(
      /href="\.\.\/\.\.\/assets\/css\//g,
      'href="assets/css/'
    );
    // Update image paths from ../../assets/img/ to assets/img/
    htmlContent = htmlContent.replace(
      /src="\.\.\/\.\.\/assets\/img\//g,
      'src="assets/img/'
    );

    return htmlContent;
  }

  /**
   * Prepare a single banner for deployment
   * @param {string} bannerName - Name of the banner (e.g., "970x250")
   */
  prepareBanner(bannerName) {
    const reviewBannerDir = path.join(this.reviewDir, "banners", bannerName);
    const deployBannerDir = path.join(this.deployDir, bannerName);

    // Create deploy banner directory
    if (fs.existsSync(deployBannerDir)) {
      fs.rmSync(deployBannerDir, { recursive: true, force: true });
    }
    fs.mkdirSync(deployBannerDir, { recursive: true });

    // Read HTML to find asset references
    const htmlPath = path.join(reviewBannerDir, "index.html");
    let htmlContent = fs.readFileSync(htmlPath, "utf8");
    const assets = this.extractAssetReferences(htmlContent);

    // Update HTML paths
    htmlContent = this.updateAssetPaths(htmlContent);
    fs.writeFileSync(path.join(deployBannerDir, "index.html"), htmlContent);

    // Copy fallback image if it exists
    const fallbackPath = path.join("banners", bannerName, "fallback.jpg");
    if (fs.existsSync(fallbackPath)) {
      fs.copyFileSync(fallbackPath, path.join(deployBannerDir, "fallback.jpg"));
    }

    // Create assets directories
    const assetsDir = path.join(deployBannerDir, "assets");
    fs.mkdirSync(assetsDir, { recursive: true });

    // Copy CSS files
    if (assets.css.length > 0) {
      const cssDir = path.join(assetsDir, "css");
      fs.mkdirSync(cssDir, { recursive: true });

      assets.css.forEach((cssFile) => {
        const srcPath = path.join(this.reviewDir, "assets", "css", cssFile);
        const destPath = path.join(cssDir, cssFile);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      });
    }

    // Copy image files
    if (assets.img.length > 0) {
      const imgDir = path.join(assetsDir, "img");
      fs.mkdirSync(imgDir, { recursive: true });

      assets.img.forEach((imgFile) => {
        const srcPath = path.join(this.reviewDir, "assets", "img", imgFile);
        const destPath = path.join(imgDir, imgFile);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      });
    }

    // Copy JS files from review banner directory
    const reviewJsDir = path.join(reviewBannerDir, "assets", "js");
    if (fs.existsSync(reviewJsDir)) {
      const jsDir = path.join(assetsDir, "js");
      this.copyDirectory(reviewJsDir, jsDir);
    }

    console.log(`✅ Prepared ${bannerName} for deployment`);
  }

  /**
   * Create zip file for a banner directory
   * @param {string} bannerName - Name of the banner
   * @returns {Promise<string>} - Path to created zip file
   */
  async createBannerZip(bannerName) {
    const bannerDir = path.join(this.deployDir, bannerName);
    const zipPath = path.join(this.deployDir, `${bannerName}.zip`);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        const sizeKB = this.getFileSizeKB(zipPath);
        console.log(`📦 Created ${bannerName}.zip (${sizeKB.toFixed(1)}KB)`);

        if (sizeKB > this.maxSizeKB) {
          console.warn(
            `⚠️  ${bannerName}.zip exceeds size limit (${this.maxSizeKB}KB)`
          );
        }

        resolve(zipPath);
      });

      archive.on("error", reject);
      archive.pipe(output);

      // Add banner files to zip
      archive.directory(bannerDir, false);
      archive.finalize();
    });
  }

  /**
   * Deploy all banners
   */
  async deployBanners() {
    // Check if review directory exists
    if (!fs.existsSync(this.reviewDir)) {
      console.error(
        `❌ Review directory not found. Please run 'npm run build' first.`
      );
      process.exit(1);
    }

    this.ensureDeployDir();

    // Get all banner directories from review
    const reviewBannerDirs = glob.sync(`${this.reviewDir}/banners/*/`, {
      ignore: `${this.reviewDir}/banners/_*`,
    });

    const bannerNames = reviewBannerDirs.map((dir) => path.basename(dir));

    console.log(`\n🚀 Deploying ${bannerNames.length} banners...\n`);

    // Prepare each banner
    for (const bannerName of bannerNames) {
      this.prepareBanner(bannerName);
    }

    console.log(`\n📦 Creating zip files...\n`);

    // Create zip files for all banners
    const zipPromises = bannerNames.map((name) => this.createBannerZip(name));
    await Promise.all(zipPromises);

    // Create master zip with all banners
    await this.createMasterZip(bannerNames);

    // Clean up unzipped banner directories
    console.log(`\n🧹 Cleaning up temporary files...\n`);
    for (const bannerName of bannerNames) {
      const bannerDir = path.join(this.deployDir, bannerName);
      if (fs.existsSync(bannerDir)) {
        fs.rmSync(bannerDir, { recursive: true, force: true });
      }
    }

    console.log(
      `\n✅ Deployment complete! Files saved to ${this.deployDir}/\n`
    );
  }

  /**
   * Create master zip file containing all banner zips
   * @param {string[]} bannerNames - Array of banner names
   * @returns {Promise<string>} - Path to created zip file
   */
  async createMasterZip(bannerNames) {
    // Get project name from package.json
    const packageJsonPath = path.join(process.cwd(), "package.json");
    let projectName = "banners";

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      projectName = packageJson.name.toUpperCase().replace(/^(\d+-)/, "");
    }

    const zipPath = path.join(this.deployDir, `${projectName}.zip`);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        const sizeKB = this.getFileSizeKB(zipPath);
        console.log(
          `📦 Created master ${projectName}.zip (${sizeKB.toFixed(1)}KB)`
        );
        resolve(zipPath);
      });

      archive.on("error", reject);
      archive.pipe(output);

      // Add individual banner zips to master zip
      bannerNames.forEach((name) => {
        const bannerZipPath = path.join(this.deployDir, `${name}.zip`);
        if (fs.existsSync(bannerZipPath)) {
          archive.file(bannerZipPath, { name: `${name}.zip` });
        }
      });

      archive.finalize();
    });
  }

  /**
   * Clean deploy directory
   */
  clean() {
    if (fs.existsSync(this.deployDir)) {
      fs.rmSync(this.deployDir, { recursive: true, force: true });
      console.log(`Cleaned ${this.deployDir} directory`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const deployer = new BannerDeployer();
  const command = process.argv[2];

  if (command === "clean") {
    deployer.clean();
  } else {
    deployer.deployBanners().catch(console.error);
  }
}

module.exports = BannerDeployer;
