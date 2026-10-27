import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  devToolbar: {
    enabled: false,
  },
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  session: {
    driver: 'memory',
  },
  integrations: [react()],
});
