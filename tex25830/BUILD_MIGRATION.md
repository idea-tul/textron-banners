# Build System Migration Guide

This project has been migrated from Gulp to a modern build system using Vite + npm scripts.

## 🚀 New Build Commands

### Development

```bash
npm run dev                    # Start development server for all banners
npm run dev:banner <name>      # Start development server for specific banner
npm run dev:list               # List available banners
npm start                      # Alias for npm run dev
```

**Examples:**
```bash
npm run dev:banner 300x250-1   # Develop only the 300x250-1 banner
npm run dev:banner 728x90      # Develop only the 728x90 banner
```

### Building & Review

```bash
npm run build      # Build all banners for production
npm run review     # Build and generate review page
npm run preview    # Preview built banners
```

### Deployment

```bash
npm run deploy     # Create zip files for ad platform distribution
npm run deploy:clean  # Clean deployment directory
```

### Template Processing

```bash
npm run process-templates  # Process banner templates (replace {{width}}, {{height}})
```

## 📁 New File Structure

```
├── vite.config.js           # Vite configuration
├── postcss.config.js        # PostCSS configuration
├── build-scripts/           # Custom build scripts
│   ├── template-processor.js   # Template variable replacement
│   ├── banner-deploy.js        # Banner zip creation
│   └── review-generator.js     # Review page generation
├── banners/                 # Banner directories
├── _review/                 # Generated review page
└── _deploy/                 # Generated zip files
```

## 🔧 What Changed

### Removed (Gulp Dependencies)

- All `gulp-*` packages
- `browser-sync` (replaced by Vite dev server)
- `run-sequence`
- `require-dir`
- Old PostCSS versions

### Added (Modern Dependencies)

- `vite` - Fast development server and build tool
- `postcss@8` - Latest PostCSS version
- Modern PostCSS plugins with updated versions
- `archiver` - For creating zip files
- `glob` - For file pattern matching

### Key Improvements

1. **Faster Development**: Vite provides instant hot reload
2. **Banner-Specific Development**: Work on individual banners without building all
3. **Modern JavaScript**: ES modules and modern JS features supported
4. **Simplified Configuration**: Less complex than Gulp setup
5. **Better Performance**: Faster builds and smaller bundle sizes
6. **Future-Proof**: Uses modern web development standards

## 🎯 Feature Parity

All original Gulp functionality has been preserved:

- ✅ CSS Processing (PostCSS with autoprefixer, variables, calc, etc.)
- ✅ Template Variable Replacement (`{{width}}`, `{{height}}`)
- ✅ Live Development Server with Hot Reload
- ✅ Banner Review Page Generation
- ✅ Zip File Creation for Deployment
- ✅ File Size Validation
- ✅ Multi-banner Support

## 🔍 PostCSS Features

The following PostCSS features are maintained:

- **Variables**: `$width: 300px;`
- **Position Shortcuts**: `absolute: top left right bottom;`
- **Calc**: `width: calc(100% - 20px);`
- **Autoprefixer**: Automatic vendor prefixes
- **CSS Sorting**: Zen-style property ordering

## 🏃‍♂️ Migration Steps

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Start Development**:

   ```bash
   npm run dev                    # All banners
   npm run dev:banner 300x250-1  # Specific banner
   npm run dev:list               # List available banners
   ```

3. **Build for Production**:

   ```bash
   npm run build
   ```

4. **Generate Review Page**:

   ```bash
   npm run review
   ```

5. **Create Deployment Zips**:
   ```bash
   npm run deploy
   ```

## 🛠 Troubleshooting

### Port Already in Use

If port 3000 is occupied, Vite will automatically use the next available port.

### Template Variables Not Replaced

Make sure to run `npm run process-templates` or use `npm run dev` which includes template processing.

### Missing Dependencies

Run `npm install` to ensure all dependencies are installed.

### PostCSS Errors

Check `postcss.config.js` for plugin configuration. All plugins should be compatible with PostCSS 8.

### Banner Not Found

If you get "Banner not found" error, run `npm run dev:list` to see available banners. Make sure the banner directory exists and contains an `index.html` file.

### Development Server Issues

- **Single Banner Development**: Use `npm run dev:banner <name>` for focused development
- **All Banners**: Use `npm run dev` to work with multiple banners simultaneously
- **Port Conflicts**: Vite will automatically find an available port if 3000 is busy

## 📚 Documentation

- [Vite Documentation](https://vitejs.dev/)
- [PostCSS Documentation](https://postcss.org/)
- [Banner Development Guide](./README.md)

---

_This migration maintains full backward compatibility while providing a modern, fast development experience._
