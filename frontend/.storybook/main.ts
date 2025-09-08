import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-controls',
    '@storybook/addon-backgrounds',
    '@storybook/addon-measure',
    '@storybook/addon-outline'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  viteFinal: async (config) => {
    // Merge with Vite config for aliases and plugins
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '/src',
      '@components': '/src/components',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
      '@styles': '/src/styles',
      '@assets': '/src/assets'
    }
    
    return config
  }
}

export default config