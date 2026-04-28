#!/usr/bin/env node

const { spawn } = require('child_process');
const { glob } = require('glob');
const path = require('path');

/**
 * Development helper for running specific banners
 */
class BannerDevHelper {
  constructor() {
    this.availableBanners = this.getAvailableBanners();
  }

  /**
   * Get list of available banners
   */
  getAvailableBanners() {
    return glob.sync("banners/*/index.html").map((file) => {
      const dir = file.replace("/index.html", "");
      const name = dir.replace("banners/", "");
      return name;
    }).filter(name => !name.startsWith('_')); // Exclude template directories
  }

  /**
   * List available banners
   */
  listBanners() {
    console.log('📦 Available banners:');
    this.availableBanners.forEach(banner => {
      console.log(`  • ${banner}`);
    });
    console.log('\n💡 Usage:');
    console.log('  npm run dev:banner <banner-name>');
    console.log('  npm run dev:banner 300x250-1');
  }

  /**
   * Start development server for specific banner
   */
  startDev(bannerName) {
    if (!bannerName) {
      console.error('❌ Please specify a banner name');
      this.listBanners();
      process.exit(1);
    }

    if (!this.availableBanners.includes(bannerName)) {
      console.error(`❌ Banner "${bannerName}" not found.`);
      this.listBanners();
      process.exit(1);
    }

    console.log(`🚀 Starting development server for: ${bannerName}`);
    console.log(`📂 Banner directory: banners/${bannerName}/`);
    console.log('🔥 Hot reload enabled\n');

    // Set environment variable and start Vite
    const env = { ...process.env, BANNER: bannerName, NODE_ENV: 'development' };
    
    const viteProcess = spawn('npx', ['vite'], {
      stdio: 'inherit',
      env
    });

    viteProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Development server exited with code ${code}`);
        process.exit(code);
      }
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping development server...');
      viteProcess.kill('SIGINT');
    });
  }
}

// Run if called directly
if (require.main === module) {
  const helper = new BannerDevHelper();
  const command = process.argv[2];
  const bannerName = process.argv[3];

  if (command === 'list' || !command) {
    helper.listBanners();
  } else if (command === 'start') {
    helper.startDev(bannerName);
  } else {
    // Assume the command is the banner name
    helper.startDev(command);
  }
}

module.exports = BannerDevHelper;
