import { HTMLObjectAttributes } from "@/types/htmlObjectAttributes.types";

export function makeHTMLElementObjForLLM(element:Element):HTMLObjectAttributes{

    const objectForLLM: HTMLObjectAttributes = {
        id : null,  //sorted
        name: null,  //sorted
        type: null,  //sorted
        tagName: "input",  //sorted
        placeholder: null,  //sorted
        inputMode: null,  //sorted
        label: null,  //sorted
        value: null,  //sorted

        meta:{

            parentId: null,
            parentText: null,
            siblingIds: null,
            siblingTexts: null,
            uncleIds: null,
            uncleTexts: null,
            sectionHeading: null,
            dataset: null,

        }
    }

    //extract element attributes

    objectForLLM.id = element.id || element.getAttribute('id') || null;
    objectForLLM.name = (element.getAttribute('name')) || null;
    objectForLLM.type = (element.getAttribute('type')) || null;
    objectForLLM.tagName = element.tagName;
    objectForLLM.placeholder = (element.getAttribute('placeholder')) || null;
    objectForLLM.inputMode = (element.getAttribute('inputmode')) || null;
    objectForLLM.value = (element.getAttribute('value')) || null;

    //now wee will use element[id] to find other values like label, parentText, siblingTexts etc.

    //label
    objectForLLM.label = getLabel(element);

    //meta context extraction - parent, siblings, uncles, section heading, dataset
    objectForLLM.meta.parentId = getParentId(element);
    objectForLLM.meta.parentText = getParentText(element);
    objectForLLM.meta.siblingIds = getSiblingIds(element);
    objectForLLM.meta.siblingTexts = getSiblingTexts(element);
    objectForLLM.meta.uncleIds = getUncleIds(element);
    objectForLLM.meta.uncleTexts = getUncleTexts(element);
    objectForLLM.meta.sectionHeading = getSectionHeading(element);
    objectForLLM.meta.dataset = getDataset(element);

    return objectForLLM
}


function getLabel(element: Element): string | null {
  const el = element as HTMLElement
  const parts = new Set<string>()

  // label for id
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`)
    if (label?.textContent) parts.add(label.textContent.trim())
  }

  //parent or closest label
  const parentLabel = el.closest('label')
  if (parentLabel?.textContent) parts.add(parentLabel.textContent.trim())

  // aria label
  const ariaLabel = el.getAttribute('aria-label')
  if (ariaLabel) parts.add(ariaLabel.trim())

  // aria-labelledby
  const labelledBy = el.getAttribute('aria-labelledby')
  if (labelledBy) {
    labelledBy.split(' ').forEach(id => {
      const ref = document.getElementById(id)
      if (ref?.textContent) parts.add(ref.textContent.trim())
    })
  }

  //previous sibling
  const prev = el.previousElementSibling as HTMLElement
  if (prev?.innerText && prev.innerText.length < 50) {
    parts.add(prev.innerText.trim())
  }
  //next sibling
  const next = el.nextElementSibling as HTMLElement
  if (next?.innerText && next.innerText.length < 50) {
    parts.add(next.innerText.trim())
  }

  //wrapper/container label
  const container = el.closest('.input-group, .form-group, .field, div');

  if (container) {
    const label = container.querySelector('label');    
    if (label?.textContent) {
      parts.add(label.textContent.trim());
    }
  }

  if (parts.size === 0 && el.getAttribute('placeholder')) {
    parts.add(el.getAttribute('placeholder')!)
  }
  

  return parts.size ? Array.from(parts).join(' | ') : null
}


function getParentId(el:Element){
  return el.parentElement?.id || el.parentElement?.getAttribute('id') || null; 
}

function getParentText(el:Element){

  let returnValue:string | null = null;
  const parent = el.parentElement;
  if(parent){
    const parentText = parent.textContent?.trim() || null;
    const parentName = parent.getAttribute('name') || null;
    const parentPlaceholder = parent.getAttribute('placeholder') || null;
    const parentLabel = getLabel(parent);

    returnValue =  `${parentText ? `Text: ${parentText}` : ''}${parentName ? ` | Name: ${parentName}` : ''}${parentPlaceholder ? ` | Placeholder: ${parentPlaceholder}` : ''}${parentLabel ? ` | Label: ${parentLabel}` : ''}` || null;
  }

  return returnValue;
}

function getSiblingIds(el:Element){

  let returnValue:string | null = null;

  const prevSiblingId = el.previousElementSibling?.id || el.previousElementSibling?.getAttribute('id') || null;
  const nextSiblingId = el.nextElementSibling?.id || el.nextElementSibling?.getAttribute('id') || null;

  returnValue = `prevSiblingId: ${prevSiblingId ? prevSiblingId : 'null'} | nextSiblingId: ${nextSiblingId ? nextSiblingId : 'null'}`;
  return returnValue;
}

function getSiblingTexts(el:Element){
  let returnValue:string | null = null;

  const prevSiblingText = el.previousElementSibling?.textContent?.trim() || null;
  const prevSiblingName = el.previousElementSibling?.getAttribute('name') || null;
  const prevSiblingPlaceholder = el.previousElementSibling?.getAttribute('placeholder') || null;
  const prevSiblingLabel = getLabel(el.previousElementSibling as Element);

  const nextSiblingText = el.nextElementSibling?.textContent?.trim() || null;
  const nextSiblingName = el.nextElementSibling?.getAttribute('name') || null;
  const nextSiblingPlaceholder = el.nextElementSibling?.getAttribute('placeholder') || null;
  const nextSiblingLabel = getLabel(el.nextElementSibling as Element);
  
  returnValue =
   `prevSibling: ${prevSiblingText ? 
   `Text: ${prevSiblingText}` : ''}${prevSiblingName ? ` | 
   Name: ${prevSiblingName}` : ''}${prevSiblingPlaceholder ? ` | 
   Placeholder: ${prevSiblingPlaceholder}` : ''}${prevSiblingLabel ? ` | 
   Label: ${prevSiblingLabel}` : ''} || nextSibling: ${nextSiblingText ? 
   `Text: ${nextSiblingText}` : ''}${nextSiblingName ? `
    | Name: ${nextSiblingName}` : ''}${nextSiblingPlaceholder ? ` |
    Placeholder: ${nextSiblingPlaceholder}` : ''}${nextSiblingLabel ? ` | Label: ${nextSiblingLabel}` : ''}`;

  return returnValue;
}

function getUncleIds(el:Element){
  let returnValue:string | null = null;
  
  const parent = el.parentElement;
  const prevUncleId = parent?.previousElementSibling?.id || parent?.previousElementSibling?.getAttribute('id') || null;
  const nextUncleId = parent?.nextElementSibling?.id || parent?.nextElementSibling?.getAttribute('id') || null;
  
  returnValue = `prevUncleId: ${prevUncleId ? prevUncleId : 'null'} | nextUncleId: ${nextUncleId ? nextUncleId : 'null'}`;
  return returnValue;

}

function getUncleTexts(el:Element){
  let returnValue:string | null = null;
  
  const parent = el.parentElement;
  const prevUncleText = parent?.previousElementSibling?.textContent?.trim() || null;
  const prevUncleName = parent?.previousElementSibling?.getAttribute('name') || null;
  const prevUnclePlaceholder = parent?.previousElementSibling?.getAttribute('placeholder') || null;
  const prevUncleLabel = getLabel(parent?.previousElementSibling as Element);

  const nextUncleText = parent?.nextElementSibling?.textContent?.trim() || null;
  const nextUncleName = parent?.nextElementSibling?.getAttribute('name') || null;
  const nextUnclePlaceholder = parent?.nextElementSibling?.getAttribute('placeholder') || null;
  const nextUncleLabel = getLabel(parent?.nextElementSibling as Element);
  
  returnValue =
   `prevUncle: ${prevUncleText ? 
   `Text: ${prevUncleText}` : ''}${prevUncleName ? ` | 
   Name: ${prevUncleName}` : ''}${prevUnclePlaceholder ? ` | 
   Placeholder: ${prevUnclePlaceholder}` : ''}${prevUncleLabel ? ` | 
   Label: ${prevUncleLabel}` : ''} || nextUncle: ${nextUncleText ? 
   `Text: ${nextUncleText}` : ''}${nextUncleName ? `
    | Name: ${nextUncleName}` : ''}${nextUnclePlaceholder ? ` |
    Placeholder: ${nextUnclePlaceholder}` : ''}${nextUncleLabel ? ` | Label: ${nextUncleLabel}` : ''}`;

  return returnValue;

}

function getSectionHeading(el:Element){
  let returnValue:string | null = null;

  const section = el.closest('section, article, main, div');
  if(section){
    const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
    if(heading?.textContent){
      returnValue = heading.textContent.trim();
    }
  }

  return returnValue;

}

function getDataset(el:Element){
  if (!(el instanceof HTMLElement)) return null;

  const data = el.dataset;
  const returnValue: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(data)) {
    const lowered = key.toLowerCase();
    const isUsefulKey =
      lowered.includes('field') ||
      lowered.includes('name') ||
      lowered.includes('type');

    if (!isUsefulKey || typeof rawValue !== 'string') {
      continue;
    }

    returnValue[key] = rawValue;
  }

  return Object.keys(returnValue).length ? returnValue : null;
} 