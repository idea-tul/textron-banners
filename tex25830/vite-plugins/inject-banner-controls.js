/**
 * Vite plugin to inject banner controls during development
 * This enables the timeline/tween bar for GSAP animation control
 */
export default function injectBannerControls() {
  return {
    name: "inject-banner-controls",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        // Only inject in development mode
        const isDev = process.env.NODE_ENV !== "production";

        if (isDev) {
          // Add dev-specific styles to position banner nicely with controls
          const devStyles = `
<style>
  body {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  #ad {
    position: relative !important;
    margin: 20px auto !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .banner-controls {
    position: fixed !important;
    bottom: 0 !important;
    z-index: 9999;
  }
  /* Info badge */
  body::before {
    content: "🎬 Development Mode - Timeline Controls Active";
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 8px 16px;
    background: rgba(0, 150, 255, 0.9);
    color: white;
    font-size: 12px;
    border-radius: 4px;
    z-index: 10000;
    font-weight: 500;
  }
</style>`;

          // Inject dev styles before closing head tag
          html = html.replace("</head>", `${devStyles}</head>`);

          // Inject banner controls script at the designated injection point
          const controlsScript =
            '<script src="assets/_banner-support-files/controls/_banners.js"></script>';
          html = html.replace(
            "<!-- {inject:banner-controls} -->",
            controlsScript
          );
        } else {
          // Remove the injection comment in production
          html = html.replace("<!-- {inject:banner-controls} -->", "");
        }

        // Clean up ad platform injection comment (used for production ad platforms)
        html = html.replace("<!-- {inject:ad-platform-lib-url} -->", "");

        return html;
      },
    },
  };
}
