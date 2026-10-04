// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://malppr.github.io',
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/dev/') })],
  // Old React-site URLs, so existing links keep working.
  redirects: {
    '/projects/p1': '/projects/beetlebot',
    '/projects/p2': '/projects/leap-tts',
    '/projects/p3': '/projects/lumicomb',
    '/projects/p4': '/projects/golden-grips',
    '/projects/p5': '/projects/knee-exoskeleton',
    '/projects/p6': '/projects/hyperx-tts',
    '/projects/p7': '/projects/robotic-bookshelf',
    '/projects/p8': '/projects/tms-coil',
  },
});
