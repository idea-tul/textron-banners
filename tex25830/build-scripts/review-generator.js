#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

/**
 * Generate review page for all banners
 * This replaces the gulp review functionality
 */
class ReviewGenerator {
  constructor() {
    this.reviewDir = "_review";
    this.packageJson = require("../package.json");
  }

  /**
   * Extract project info from package.json
   */
  getProjectInfo() {
    const nameParts = this.packageJson.name.split("-");
    return {
      year: nameParts[0] || "",
      clientCode: (nameParts[1] || "").toUpperCase(),
      jobCode: nameParts[2] || "",
      title: this.packageJson.title || "Banner Review",
      name: this.packageJson.name,
    };
  }

  /**
   * Calculate total size of all files in a directory
   * @param {string} dirPath - Path to directory
   * @returns {number} - Total size in bytes
   */
  getDirectorySize(dirPath) {
    let totalSize = 0;

    const calculateSize = (currentPath) => {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          calculateSize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    };

    calculateSize(dirPath);
    return totalSize;
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} - Formatted size
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  /**
   * Get banner information
   */
  getBannerInfo() {
    const bannerDirs = glob.sync("banners/*/", { ignore: "banners/_*" });

    return bannerDirs.map((dir) => {
      const name = path.basename(dir);
      const sizeMatch = name.match(/(\d+)x(\d+)/);
      const width = sizeMatch ? sizeMatch[1] : "300";
      const height = sizeMatch ? sizeMatch[2] : "250";

      // Calculate total file size
      const totalBytes = this.getDirectorySize(dir);
      const formattedSize = this.formatBytes(totalBytes);

      return {
        name,
        width: parseInt(width),
        height: parseInt(height),
        path: dir,
        sizeBytes: totalBytes,
        sizeFormatted: formattedSize,
      };
    });
  }

  /**
   * Generate review HTML page
   */
  generateReviewPage() {
    const project = this.getProjectInfo();
    const banners = this.getBannerInfo();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title} - Banner Review</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
        }
        
        /* Header with hamburger menu */
        .header {
            position: sticky;
            top: 0;
            z-index: 100;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px 20px;
        }
        
        .header-info h1 { 
            margin: 0 0 5px 0; 
            color: #333; 
            font-size: 24px;
        }
        
        .header-info p { 
            margin: 0; 
            color: #666; 
            font-size: 14px;
        }
        
        /* Hamburger Button */
        .hamburger {
            background: #007bff;
            border: none;
            padding: 12px 16px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 4px;
            transition: background-color 0.2s;
        }
        
        .hamburger:hover {
            background: #0056b3;
        }
        
        .hamburger span {
            display: block;
            width: 24px;
            height: 3px;
            background: white;
            border-radius: 2px;
            transition: all 0.3s;
        }
        
        .hamburger.active span:nth-child(1) {
            transform: rotate(45deg) translate(6px, 6px);
        }
        
        .hamburger.active span:nth-child(2) {
            opacity: 0;
        }
        
        .hamburger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(6px, -6px);
        }
        
        /* Dropdown Menu */
        .dropdown-menu {
            position: absolute;
            top: 100%;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 10px 0;
            min-width: 200px;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }
        
        .dropdown-menu.active {
            max-height: 600px;
            overflow-y: auto;
        }
        
        .dropdown-item {
            display: block;
            padding: 12px 20px;
            color: #333;
            text-decoration: none;
            font-size: 14px;
            transition: background-color 0.2s;
            cursor: pointer;
        }
        
        .dropdown-item:hover {
            background: #f8f9fa;
        }
        
        .dropdown-item.active {
            background: #007bff;
            color: white;
        }
        
        /* Main Content */
        .main-content {
            padding: 20px;
        }
        
        .banner-viewer {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 30px;
            text-align: center;
        }
        
        .banner-info {
            margin-bottom: 20px;
        }
        
        .banner-info h2 {
            margin: 0 0 5px 0;
            color: #333;
            font-size: 20px;
        }
        
        .banner-info p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
        
        .banner-size {
            margin-top: 5px;
            color: #888;
            font-size: 13px;
            font-family: 'Courier New', monospace;
        }
        
        .banner-frame-container {
            display: inline-block;
            margin: 20px 0;
        }
        
        .banner-frame {
            border: 2px solid #ddd;
            background: #f8f9fa;
            position: relative;
            display: inline-block;
        }
        
        .banner-frame iframe {
            display: block;
            border: none;
        }
        
        .banner-actions {
            margin-top: 20px;
        }
        
        .btn {
            display: inline-block;
            padding: 10px 20px;
            margin: 0 5px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
            transition: background-color 0.2s;
            border: none;
            cursor: pointer;
        }
        
        .btn:hover { 
            background: #0056b3; 
        }
        
        .btn-secondary {
            background: #6c757d;
        }
        
        .btn-secondary:hover { 
            background: #545b62; 
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .header-info h1 {
                font-size: 18px;
            }
            
            .header-info p {
                font-size: 12px;
            }
            
            .banner-viewer {
                padding: 15px;
            }
            
            .banner-frame {
                max-width: 100%;
                overflow: auto;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="header-info">
                <h1>${project.title}</h1>
                <p>Project: ${
                  project.name
                } | Generated: ${new Date().toLocaleDateString()}</p>
            </div>
            <button class="hamburger" id="hamburger" aria-label="Menu">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
        <div class="dropdown-menu" id="dropdown">
            ${banners
              .map(
                (banner, index) => `
            <a class="dropdown-item${index === 0 ? " active" : ""}" 
               data-banner="${index}"
               onclick="loadBanner(${index})">
                ${banner.name} (${banner.width}×${banner.height})
            </a>
            `
              )
              .join("")}
        </div>
    </div>
    
    <div class="main-content">
        <div class="banner-viewer">
            <div class="banner-info" id="banner-info">
                <h2>${banners[0].name}</h2>
                <p>${banners[0].width} × ${banners[0].height} pixels</p>
                <p class="banner-size">Bundle size: ${
                  banners[0].sizeFormatted
                }</p>
            </div>
            <div class="banner-frame-container">
                <div class="banner-frame" id="banner-frame" style="width: ${
                  banners[0].width
                }px; height: ${banners[0].height}px;">
                    <iframe 
                        id="banner-iframe"
                        src="${banners[0].path}/index.html" 
                        width="${banners[0].width}" 
                        height="${banners[0].height}"
                        title="${banners[0].name} Preview">
                    </iframe>
                </div>
            </div>
            <div class="banner-actions">
                <button onclick="replayBanner()" class="btn">Replay</button>
                <a href="${
                  banners[0].path
                }/index.html" target="_blank" class="btn" id="view-full-btn">View Full</a>
                <a href="${
                  banners[0].path
                }" target="_blank" class="btn btn-secondary" id="view-files-btn">View Files</a>
            </div>
        </div>
    </div>
    
    <script>
        // Banner data
        const banners = ${JSON.stringify(banners)};
        let currentBanner = 0;
        
        // Hamburger menu toggle
        const hamburger = document.getElementById('hamburger');
        const dropdown = document.getElementById('dropdown');
        
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            dropdown.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header')) {
                hamburger.classList.remove('active');
                dropdown.classList.remove('active');
            }
        });
        
        // Replay banner function
        function replayBanner() {
            loadBanner(currentBanner);
        }
        
        // Load banner function
        function loadBanner(index) {
            currentBanner = index;
            const banner = banners[index];
            
            // Update active state in menu
            document.querySelectorAll('.dropdown-item').forEach((item, i) => {
                item.classList.toggle('active', i === index);
            });
            
            // Update banner info
            document.getElementById('banner-info').innerHTML = \`
                <h2>\${banner.name}</h2>
                <p>\${banner.width} × \${banner.height} pixels</p>
                <p class="banner-size">Bundle size: \${banner.sizeFormatted}</p>
            \`;
            
            // Update frame size
            const frame = document.getElementById('banner-frame');
            frame.style.width = banner.width + 'px';
            frame.style.height = banner.height + 'px';
            
            // Force complete iframe reload by removing and recreating it
            const oldIframe = document.getElementById('banner-iframe');
            const newIframe = document.createElement('iframe');
            newIframe.id = 'banner-iframe';
            newIframe.src = banner.path + '/index.html';
            newIframe.width = banner.width;
            newIframe.height = banner.height;
            newIframe.title = banner.name + ' Preview';
            
            // Replace the old iframe with the new one
            oldIframe.parentNode.replaceChild(newIframe, oldIframe);
            
            // Update buttons
            document.getElementById('view-full-btn').href = banner.path + '/index.html';
            document.getElementById('view-files-btn').href = banner.path;
            
            // Close menu
            hamburger.classList.remove('active');
            dropdown.classList.remove('active');
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && currentBanner > 0) {
                loadBanner(currentBanner - 1);
            } else if (e.key === 'ArrowRight' && currentBanner < banners.length - 1) {
                loadBanner(currentBanner + 1);
            }
        });
    </script>
</body>
</html>`;

    // Ensure review directory exists
    if (!fs.existsSync(this.reviewDir)) {
      fs.mkdirSync(this.reviewDir, { recursive: true });
    }

    // Write review page
    const reviewPath = path.join(this.reviewDir, "index.html");
    fs.writeFileSync(reviewPath, html);

    console.log(`✅ Review page generated: ${reviewPath}`);
    console.log(`📱 Found ${banners.length} banners`);

    return reviewPath;
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new ReviewGenerator();
  generator.generateReviewPage();
}

module.exports = ReviewGenerator;
