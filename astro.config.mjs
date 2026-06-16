// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://jaydenw.dev',
  integrations: [sitemap(), mdx()],
  output: 'static',
});
