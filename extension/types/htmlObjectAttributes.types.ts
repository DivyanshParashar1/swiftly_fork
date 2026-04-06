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
        uncleIds?: string | null, // uncles are siblings of parents, so there can be multiple
        uncleTexts?: string | null, // uncles are siblings of parents, so there can be multiple
        sectionHeading: string | null,
        dataset: Record<string, string> | null,



    }

}