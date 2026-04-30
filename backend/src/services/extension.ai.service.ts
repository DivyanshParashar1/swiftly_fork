import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import type { HTMLObjectAttributes } from "../types/htmlObjectAttributes.types";


const groq = new Groq({apiKey:process.env.GROQ_API_KEY})
const gemini = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY})

export class ExtensionAiService{


    public promptBuilder(resumeData:unknown, htmlObjectData:HTMLObjectAttributes[]):string{

        const normalizedResumeData =
            typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData)
        const normalizedHtmlObjectData = JSON.stringify(htmlObjectData ?? [])

        const prompt:string = `
You are a form autofill mapping system.

You are given:

1. USER DATA (resume JSON)
2. FORM FIELDS (array of field objects)

---

TASK

Map each field to the most appropriate value from user data.

Return ONLY the JSON object. Do not include explanations, comments, markdown, or any additional text.

Return JSON:
key → value

---

RULES

* Output ONLY valid JSON (no text, no markdown).
* Use ONLY "key" for mapping (ignore id/name).
* Do NOT skip any key.
* If no suitable value → return null.
* Do NOT guess or fabricate data.
* Prefer exact matches over approximate.

---

FIELD UNDERSTANDING

Use semantic meaning of:

1. label (most important)
2. placeholder
3. name
4. meta (parentText, siblingTexts, sectionHeading, dataset)

Ignore symbols like "*", ":".

---

FIELD TYPES

* Text/Email/Number → string
* Dropdown/Select → closest matching option text
* Checkbox/Radio → true/false
* File upload → "RESUME_FILE"
* Unknown → null

---

EXAMPLES

Email → user.email
Full Name → user.name
Phone → user.phone
Degree → user.education.degree
Skills → comma-separated skills

---

INPUT

USER DATA:
${normalizedResumeData}

FIELDS:
${normalizedHtmlObjectData}

---

OUTPUT

{
"key1": "value",
"key2": null
}

---

Return mapping for ALL keys. If unsure, return null.
        
        `
        return prompt
    }


    public async groq(resumeData:unknown, htmlObjectData:HTMLObjectAttributes[] = []){

      const prompt:string = this.promptBuilder(resumeData, htmlObjectData)

        const completion = await groq.chat.completions.create({
            model:'compound-beta-mini',
            temperature:0,
            messages:[
                {
                    role:'user',
                    content: prompt
                }
            ]
        })


        return completion.choices[0]?.message.content ?? ""

        
    }



    public async googleGemini(resumeData:unknown, htmlObjectData:HTMLObjectAttributes[] = []){

      const prompt:string = this.promptBuilder(resumeData, htmlObjectData)
        
        const response = await gemini.models.generateContent({
            model:'gemini-2.5-flash-lite',
            contents: prompt,
            config:{
                responseMimeType: "application/json",
                temperature:0
            }
        })


        return response.text ?? ""
    }
}
