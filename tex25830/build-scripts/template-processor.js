#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

/**
 * Process template files by replacing placeholders with actual values
 * This replaces the gulp template processing functionality
 */
class TemplateProcessor {
  constructor() {
    this.sizeRegExp = /(\d{2,}x\d{2,})/g
  }

  /**
   * Extract banner dimensions from directory name
   * @param {string} dirName - Directory name like "300x250-1"
   * @returns {object} - {width: 300, height: 250}
   */
  extractDimensions(dirName) {
    const match = dirName.match(this.sizeRegExp)
    if (match) {
      const [width, height] = match[0].split('x').map(Number)
      return { width, height }
    }
    return { width: 300, height: 250 } // fallback
  }

  /**
   * Process a single template file
   * @param {string} filePath - Path to the template file
   * @param {object} variables - Variables to replace in template
   */
  processFile(filePath, variables) {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Replace template variables
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, variables[key])
    })

    fs.writeFileSync(filePath, content)
  }

  /**
   * Process all banner templates
   */
  async processBanners() {
    const bannerDirs = glob.sync('banners/*/index.html')
    
    for (const htmlFile of bannerDirs) {
      const dirPath = path.dirname(htmlFile)
      const dirName = path.basename(dirPath)
      const dimensions = this.extractDimensions(dirName)
      
      console.log(`Processing banner: ${dirName} (${dimensions.width}x${dimensions.height})`)
      
      // Process HTML file
      this.processFile(htmlFile, dimensions)
      
      // Process CSS file if it exists
      const cssFile = path.join(dirPath, 'assets/css/source.css')
      if (fs.existsSync(cssFile)) {
        this.processFile(cssFile, dimensions)
      }
    }
    
    console.log('Template processing complete!')
  }
}

// Run if called directly
if (require.main === module) {
  const processor = new TemplateProcessor()
  processor.processBanners().catch(console.error)
}

module.exports = TemplateProcessor
