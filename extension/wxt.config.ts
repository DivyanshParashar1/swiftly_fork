import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest:{
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
  browser:{
    firefox:{
      profile:"dbfc8y0k.wxt-dev"
    }
  }

});
