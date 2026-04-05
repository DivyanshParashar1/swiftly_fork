import { HTMLObjectAttributes } from "@/types/htmlObjectAttributes.types";

export function makeHTMLElementObjForLLM(element:Element):HTMLObjectAttributes{

    const objectForLLM: HTMLObjectAttributes = {
        id : null,
        name: null,
        type: null,
        tagName: "input",
        placeholder: null,
        inputMode: null,
        label: null,
        value: null,

        meta:{

            parentId: null,
            parentText: null,
            siblingIds: null,
            siblingTexts: null,
            sectionHeading: null,
            dataset: null,

        }
    }

    //extract element attributes

    objectForLLM.id = element.id || element.getAttribute('id') || null;
    objectForLLM.name = (element.getAttribute('name')) || null;
    objectForLLM.type = (element.getAttribute('type')) || null;
    objectForLLM.tagName = element.tagName.toLowerCase() || "input";
    objectForLLM.placeholder = (element.getAttribute('placeholder')) || null;
    objectForLLM.inputMode = (element.getAttribute('inputmode')) || null;
    objectForLLM.value = (element.getAttribute('value')) || null;

    //now wee will use element[id] to find other values like label, parentText, siblingTexts etc.

    //label
    




    return objectForLLM
}
