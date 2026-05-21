import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest:{
    name: 'Swiftly – Job Application Autofill',
    short_name: 'Swiftly',
    description: 'Autofill job applications using your selected Swiftly resume.',
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '96': 'icon/96.png',
      '128': 'icon/128.png'
    },
    action: {
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png'
      }
    },
    permissions:[
      "storage",
      "activeTab",
      "scripting",
      "tabs", 
      "sidePanel",
      "cookies"
      
    ],
    host_permissions:[
      "<all_urls>"
    ],
  },

});
