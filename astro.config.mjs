// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://superhighway.fm',
  output: 'static',
  build: {
    // One small page: inline the CSS instead of a render-blocking request.
    inlineStylesheets: 'always',
  },
});
