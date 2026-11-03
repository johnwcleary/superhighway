// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://superhighway.fm',
  output: 'static',
  integrations: [sitemap()],
  build: {
    // One small page: inline the CSS instead of a render-blocking request.
    inlineStylesheets: 'always',
  },
});
