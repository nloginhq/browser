import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  name: 'nlogin.me',
  description: '',
  version: '0.0.1',
  manifest_version: 3,
  icons: {
    '16': 'img/icon16.png',
    '48': 'img/icon48.png',
    '128': 'img/icon128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'img/icon48.png',
  },
  options_page: 'options.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/index.ts'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['img/icon16.png', 'img/icon48.png', 'img/icon128.png'],
      matches: [],
    },
  ],
  externally_connectable: {
    matches: ['http://*/*', 'https://*/*'],
  },
  permissions: ['activeTab', 'storage'],
  commands: {
    _execute_action: {
      suggested_key: {
        default: 'Alt+Shift+K',
        mac: 'MacCtrl+Command+K',
      },
    },
  },
})
