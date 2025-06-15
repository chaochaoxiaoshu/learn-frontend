// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'

import preact from '@astrojs/preact'

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Docs with Tailwind',
      defaultLocale: 'root',
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN',
        },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/chaochaoxiaoshu/learn-frontend',
        },
      ],
      sidebar: [
        {
          label: '入门指南',
          slug: 'getting-started',
        },
        {
          label: 'JavaScript',
          autogenerate: { directory: 'javascript' },
        },
        {
          label: '框架',
          items: [
            {
              label: 'Vue',
              autogenerate: { directory: 'frameworks/vue' },
            },
            {
              label: 'React',
              autogenerate: { directory: 'frameworks/react' },
            },
          ],
        },
        {
          label: '前端工程化',
          items: [
            {
              label: 'ES Module',
              slug: 'engineering/es-module',
            },
            {
              label: '打包器',
              slug: 'engineering/bundler',
            },
            {
              label: '代码格式化工具',
              slug: 'engineering/formatter',
            },
            {
              label: '代码检查工具',
              slug: 'engineering/linter',
            },
          ],
        },
        {
          label: 'TypeScript',
          autogenerate: { directory: 'typescript' },
        },
        {
          label: '代码挑战',
          autogenerate: { directory: 'challenges' },
        },
        {
          label: '前端英语',
          autogenerate: { directory: 'english' },
        },
      ],
      customCss: ['./src/styles/global.css'],
    }),
    preact({ compat: true }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
