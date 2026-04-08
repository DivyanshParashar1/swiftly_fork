import { fetchAutofillMapping, resolveSessionState } from "@/lib/api";
import type { HTMLObjectAttributes } from "@/types/htmlObjectAttributes.types";

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'USER_LOGGED_IN') {
      chrome.runtime.sendMessage({ type: 'SWIFTLY_USER_LOGGED_IN' }).catch(() => {
        return;
      });
      sendResponse({ ok: true, forwarded: true });
      return;
    }

    if (message?.type === 'USER_LOGGED_OUT') {
      chrome.runtime.sendMessage({ type: 'SWIFTLY_USER_LOGGED_OUT' }).catch(() => {
        return;
      });
      sendResponse({ ok: true, forwarded: true });
      return;
    }

    if (message?.type !== 'SWIFTLY_REQUEST_AUTOFILL_MAPPING') {
      return;
    }

    const payload = message.payload as {
      resumeData?: unknown;
      htmlObjectData?: HTMLObjectAttributes[];
    };

    const run = async () => {
      if (payload?.resumeData === undefined || payload?.resumeData === null) {
        sendResponse({ ok: false, error: 'Missing resumeData payload.' });
        return;
      }

      const session = await resolveSessionState();
      if (!session.apiBaseUrl) {
        sendResponse({ ok: false, error: 'API base URL not available. Please sign in again.' });
        return;
      }

      const result = await fetchAutofillMapping(session.apiBaseUrl, {
        resumeData: payload.resumeData,
        htmlObjectData: payload.htmlObjectData ?? [],
      });

      if (result.status < 200 || result.status >= 300 || !result.aiResult) {
        sendResponse({ ok: false, error: 'Autofill mapping request failed.' });
        return;
      }

      sendResponse({ ok: true, aiResult: result.aiResult });
    };

    void run();
    return true;
  });

  

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
