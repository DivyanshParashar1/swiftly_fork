export function getAllFormInputFields() {

    const elements = new Set<Element>();

    const addElements = (nodeList: NodeListOf<Element>) => {
        nodeList.forEach((element) => {
            elements.add(element);
        });
    };

    addElements(document.querySelectorAll('input'));
    addElements(document.querySelectorAll('textarea'));
    addElements(document.querySelectorAll('select'));
    addElements(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
    addElements(document.querySelectorAll('[contenteditable]'));
    addElements(document.querySelectorAll(`
        [role="textbox"],
        [role="combobox"],
        [role="checkbox"],
        [role="radio"],
        [role="switch"],
        [role="slider"]
    `));

    return Array.from(elements);
}