
export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Hello content.');

    const guardKey = '__swiftlyContentMessageListenerRegistered__';
    const scopedWindow = window as unknown as Record<string, boolean | undefined>;
    if (scopedWindow[guardKey]) {
      console.log('Content listener already registered; skipping duplicate registration.');
      return;
    }
    scopedWindow[guardKey] = true;

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === 'SWIFTLY_PING') {
        sendResponse({ ok: true });
        return;
      }

      if (message?.type === 'AUTOFILL_FORM') {
        // console.log('AUTOFILL_FORM received in content script:', message?.resumeData);

        const fields = getAllFormInputFields()
        console.log(fields);

        
      }

    });
  },
});

