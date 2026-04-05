export type HTMLObjectAttributes = { 
    id :string | null,
    name: string | null,
    type: string | null,
    tagName: string,
    placeholder: string | null,
    inputMode: string | null,
    label: string | null,
    value?: string | null,

    meta:{

        parentId: string | null,
        parentText: string | null,
        siblingIds: string | null,
        siblingTexts: string | null,
        sectionHeading: string | null,
        dataset: string | null,


    }

}