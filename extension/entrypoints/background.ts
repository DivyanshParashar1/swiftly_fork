import { getSelectedResumeRawJson } from "@/lib/selectedResumeStore";

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  

  if(chrome.sidePanel){
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => {
        console.error('Error setting side panel behavior:', error);
      });


      console.log("Hello Chrome");
      

  }else{
    console.log("Hello Other Non-Chromium Browsers");
    
  }

});
