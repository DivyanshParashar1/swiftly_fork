import { makeHTMLElementObjForLLM } from "@/utils/makeHTMLElementObjForLLM";
import { getAllFormInputFields } from '@/utils/domQuery';
import type { HTMLObjectAttributes } from "@/types/htmlObjectAttributes.types";
import type { RefForHtmlFields } from '@/types/refForHtmlFields.types';
import { autofillJobApplicationForm } from '@/utils/autofill';

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
        const elements = getAllFormInputFields();
        const llmFields: HTMLObjectAttributes[]=[];

        const fieldRefs: RefForHtmlFields[] = [];

        elements.forEach((el, index)=>{
          const obj = makeHTMLElementObjForLLM(el);

          if(!obj.placeholder && !obj.name && !obj.label){
            //if there is no way to identify the element, we will skip it
            return;
          }
          const baseKey = obj.id || obj.name || obj.label || `field-${index}`;
          const genKey = `${baseKey}-${index}`;
          llmFields.push({
            ...obj,
            key: genKey,
          });
          fieldRefs.push({
            key: genKey,
            element: el as HTMLElement,
          })
        })

        chrome.runtime
          .sendMessage({
            type: 'SWIFTLY_REQUEST_AUTOFILL_MAPPING',
            payload: {
              resumeData: message?.resumeData,
              htmlObjectData: llmFields,
            },
          })
          .then((result) => {
            if (!result?.ok) {
              sendResponse({ ok: false, received: true, error: result?.error || 'Mapping failed.' });
              return;
            }

            console.log('Autofill mapping received:', result.aiResult);
            autofillJobApplicationForm(fieldRefs, (result.aiResult ?? {}) as Record<string, unknown>);
            sendResponse({
              ok: true,
              received: true,
              fieldCount: llmFields.length,
              aiResult: result.aiResult,
            });
          })
          .catch((error) => {
            console.error('Failed to request autofill mapping:', error);
            sendResponse({ ok: false, received: true, error: 'Background mapping request failed.' });
          });

        return true;


      }

      sendResponse({ ok: false, received: false });

    });
  },
});

