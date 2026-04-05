export function getAllFormInputFields() {

    const elements = new Set<Element>();

    const addElements = (nodeList: Iterable<Element>) => {
        for (const element of nodeList) {
            elements.add(element);
        }
    };

    addElements(getInputFields());
    addElements(getTextAreas());
    addElements(getSelects());
    addElements(getButtons());
    addElements(getContentEditables());
    addElements(getRoleBasedFields());

    return Array.from(elements);
}


function getInputFields(){
    const inputFields = document.querySelectorAll('input')
    return inputFields;
}

function getTextAreas(){
    const textAreas = document.querySelectorAll('textarea')
    return textAreas;
}

function getSelects() {
  const selects = document.querySelectorAll('select');

  const filtered: HTMLSelectElement[] = [];

  selects.forEach((select) => {
    const options = Array.from(select.options).filter(
      opt => opt.value || opt.innerText.trim() !== ""
    );

    if (options.length <= 10) {
      filtered.push(select);
    }
  });

  return filtered;
}

function getButtons(){
    const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]')
    return buttons;
}

function getContentEditables(){
    const contentEditables = document.querySelectorAll('[contenteditable]')
    return contentEditables;
}

function getRoleBasedFields(){
    const roleBasedFields = document.querySelectorAll(`
        [role="textbox"],
        [role="combobox"],
        [role="checkbox"],
        [role="radio"],
        [role="switch"],
        [role="slider"]
    `)
    return roleBasedFields;
}
