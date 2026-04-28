#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Banner Generator - Creates multiple banner sizes from a reference banner
 */
class BannerGenerator {
  constructor(referenceBanner = "300x250-1") {
    this.referenceBanner = referenceBanner;
    this.referencePath = path.join("banners", referenceBanner);
    this.bannersDir = "banners";
  }

  /**
   * Parse banner size from string
   * @param {string} sizeStr - Size string like "300x250"
   * @returns {object} - {width: 300, height: 250}
   */
  parseSize(sizeStr) {
    const [width, height] = sizeStr.split("x").map(Number);
    return { width, height };
  }

  /**
   * Check if reference banner exists
   */
  validateReference() {
    if (!fs.existsSync(this.referencePath)) {
      throw new Error(`Reference banner not found: ${this.referencePath}`);
    }

    const requiredFiles = [
      "index.html",
      "assets/css/source.css",
      "assets/js/script.js",
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.referencePath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing in reference banner: ${file}`);
      }
    }

    console.log(`✅ Reference banner validated: ${this.referenceBanner}`);
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
   * Update template variables in a file
   * @param {string} filePath - Path to file to update
   * @param {object} dimensions - {width, height}
   */
  updateTemplateVariables(filePath, dimensions) {
    let content = fs.readFileSync(filePath, "utf8");

    // Replace template variables
    content = content.replace(/\{\{width\}\}/g, dimensions.width);
    content = content.replace(/\{\{height\}\}/g, dimensions.height);

    // For HTML files, also update meta tags and title
    if (filePath.endsWith(".html")) {
      content = content.replace(/width=\d+/g, `width=${dimensions.width}`);
      content = content.replace(/height=\d+/g, `height=${dimensions.height}`);
      content = content.replace(
        /Ad Banner: \d+x\d+/g,
        `Ad Banner: ${dimensions.width}x${dimensions.height}`
      );
    }

    // For CSS files, also update the variables at the top
    if (filePath.endsWith(".css")) {
      content = content.replace(
        /\$width:\s*\d+px;/g,
        `$width: ${dimensions.width}px;`
      );
      content = content.replace(
        /\$height:\s*\d+px;/g,
        `$height: ${dimensions.height}px;`
      );
    }

    fs.writeFileSync(filePath, content);
  }

  /**
   * Create fallback image for banner size
   * @param {string} bannerDir - Banner directory path
   * @param {object} dimensions - {width, height}
   */
  createFallbackImage(bannerDir, dimensions) {
    // Copy the reference fallback image
    const referenceFallback = path.join(this.referencePath, "fallback.jpg");
    const newFallback = path.join(bannerDir, "fallback.jpg");

    if (fs.existsSync(referenceFallback)) {
      fs.copyFileSync(referenceFallback, newFallback);
      console.log(`  📷 Copied fallback image`);
    } else {
      console.log(`  ⚠️  No fallback image found in reference banner`);
    }
  }

  /**
   * Generate a single banner size
   * @param {string} sizeStr - Size string like "300x250"
   * @param {number} variant - Variant number (default: 1)
   */
  generateBanner(sizeStr, variant = 1) {
    const dimensions = this.parseSize(sizeStr);
    const bannerName = `${sizeStr}-${variant}`;
    const bannerDir = path.join(this.bannersDir, bannerName);

    console.log(
      `\n🎨 Generating banner: ${bannerName} (${dimensions.width}x${dimensions.height})`
    );

    // Create banner directory
    if (fs.existsSync(bannerDir)) {
      console.log(`  ⚠️  Banner ${bannerName} already exists, skipping...`);
      return;
    }

    // Copy all files from reference banner
    console.log(`  📁 Copying files from ${this.referenceBanner}...`);
    this.copyDirectory(this.referencePath, bannerDir);

    // Update template variables in key files
    const filesToUpdate = ["index.html", "assets/css/source.css"];

    for (const file of filesToUpdate) {
      const filePath = path.join(bannerDir, file);
      if (fs.existsSync(filePath)) {
        this.updateTemplateVariables(filePath, dimensions);
        console.log(`  ✏️  Updated ${file}`);
      }
    }

    // Create/copy fallback image
    this.createFallbackImage(bannerDir, dimensions);

    console.log(`  ✅ Banner ${bannerName} created successfully!`);
  }

  /**
   * Generate multiple banner sizes
   * @param {string[]} sizes - Array of size strings
   */
  generateMultipleBanners(sizes) {
    console.log(
      `🚀 Generating ${sizes.length} banner sizes from reference: ${this.referenceBanner}\n`
    );

    this.validateReference();

    for (const size of sizes) {
      this.generateBanner(size);
    }

    console.log(`\n🎉 All banners generated successfully!`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Run: npm run dev:list`);
    console.log(`   2. Develop: npm run dev:banner <banner-name>`);
    console.log(`   3. Review: npm run review`);
  }

  /**
   * List existing banners
   */
  listExistingBanners() {
    const bannerDirs = fs
      .readdirSync(this.bannersDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => entry.name)
      .sort();

    console.log("📦 Existing banners:");
    bannerDirs.forEach((banner) => {
      const dimensions = this.parseSize(banner.split("-")[0]);
      console.log(`  • ${banner} (${dimensions.width}x${dimensions.height})`);
    });

    return bannerDirs;
  }

  /**
   * Clean up generated banners (for testing)
   * @param {string[]} sizes - Array of size strings to remove
   */
  cleanupBanners(sizes) {
    console.log(`🧹 Cleaning up generated banners...`);

    for (const size of sizes) {
      const bannerName = `${size}-1`;
      const bannerDir = path.join(this.bannersDir, bannerName);

      if (fs.existsSync(bannerDir)) {
        fs.rmSync(bannerDir, { recursive: true, force: true });
        console.log(`  🗑️  Removed ${bannerName}`);
      }
    }
  }
}

// Standard IAB banner sizes
const STANDARD_SIZES = [
  "300x250", // Medium Rectangle
  "320x480", // Mobile Banner
  "320x50", // Mobile Banner
  "300x50", // Mobile Banner Small
  "160x600", // Wide Skyscraper
  "300x600", // Half Page Ad
  "728x90", // Leaderboard
  "970x90", // Super Leaderboard
  "970x250", // Billboard
  "336x250", // Large Rectangle
];

// Run if called directly
if (require.main === module) {
  const generator = new BannerGenerator();
  const command = process.argv[2];
  const sizes = process.argv.slice(3);

  try {
    switch (command) {
      case "generate":
        if (sizes.length === 0) {
          console.log("❌ Please specify banner sizes to generate");
          console.log(
            "Usage: node banner-generator.js generate 300x250 728x90 ..."
          );
          process.exit(1);
        }
        generator.generateMultipleBanners(sizes);
        break;

      case "standard":
        generator.generateMultipleBanners(STANDARD_SIZES);
        break;

      case "list":
        generator.listExistingBanners();
        break;

      case "cleanup":
        if (sizes.length === 0) {
          console.log("❌ Please specify banner sizes to cleanup");
          console.log(
            "Usage: node banner-generator.js cleanup 300x250 728x90 ..."
          );
          process.exit(1);
        }
        generator.cleanupBanners(sizes);
        break;

      case "help":
      default:
        console.log("🎨 Banner Generator");
        console.log("\nCommands:");
        console.log("  generate <sizes...>  Generate specific banner sizes");
        console.log("  standard             Generate all standard IAB sizes");
        console.log("  list                 List existing banners");
        console.log("  cleanup <sizes...>   Remove specific banner sizes");
        console.log("  help                 Show this help");
        console.log("\nExamples:");
        console.log("  node banner-generator.js generate 300x250 728x90");
        console.log("  node banner-generator.js standard");
        console.log("  node banner-generator.js list");
        console.log("\nStandard IAB Sizes:");
        STANDARD_SIZES.forEach((size) => {
          const dims = generator.parseSize(size);
          console.log(`  • ${size} (${dims.width}x${dims.height})`);
        });
        break;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

module.exports = BannerGenerator;
