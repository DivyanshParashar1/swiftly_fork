import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";


const groq = new Groq({apiKey:process.env.GROQ_API_KEY})
const gemini = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY})

export class AiService{


    public promptBuilder(resumeData:string){

        const prompt:string = `
        You are a resume parsing system.

Your task is to extract structured information from resume text and return it as a valid JSON object. The JSON will be inserted directly into a Prisma database, so the structure must match the schema exactly.

Return ONLY the JSON object. Do not include explanations, comments, markdown, or any additional text.

OBJECTIVE

Convert the provided resume text into structured JSON following the exact schema below.

IMPORTANT RULES

1. Output must be valid JSON.
2. Return ONLY JSON.
3. Do not include markdown or code block formatting.
4. If a value does not exist in the resume, return null.
5. If a section contains multiple entries, return an array.
6. If a section does not exist in the resume, return an empty array [].
7. Do NOT invent information.
8. Do NOT guess missing values.
9. Do NOT hallucinate any information.
10. Descriptions should preserve original bullet point wording but may be concatenated into a single paragraph.
11. When extracting text fields (company name, institute, titles, descriptions), preserve the exact wording from the resume. Do not paraphrase or add new words.
12. Preserve URLs exactly as written.
13. Do not duplicate the same URL across unrelated fields.
14. Dates must use YYYY-MM-DD format when possible.
15. If only month and year exist, use the first day of that month.
16. If a date cannot be determined, return null.
17. If a full name exists, split it into firstName, middleName, lastName.
18. If only two names exist, set middleName to null.
19. Identify links correctly (GitHub, LinkedIn, portfolio, coding profiles, project links).
20. GitHub repository links belong in project.githubLink.
21. Live demo or deployed project links belong in project.liveLink.
22. Skills must be extracted individually.
23. If skills appear grouped (e.g. Languages: Python, Java), extract each skill individually and assign the category.
24. If a skill category cannot be determined, set category to null.
25. Field names must match the schema exactly.
26. Education level should represent the academic level such as High School, Undergraduate, Postgraduate, Diploma. Do not repeat the degree in the level field.
27. Achievements may appear under headings such as Achievements, Awards, Honors. 
28. Positions of responsibility may appear under headings such as Leadership, Responsibility, Positions Held.
29. If a role is ongoing or marked as Present, set endDate = null.
30. If a project lists technologies or tools (e.g. React, Node.js, MongoDB), extract them into techStack as an array of strings, where each string represents one technology used in that project. If none are mentioned, return [].
31. Infer experience type from title:
Intern → INTERNSHIP
Full-time → FULL_TIME
Part-time → PART_TIME
Contract → CONTRACT
Freelance → FREELANCE
Research → RESEARCH
Volunteer → VOLUNTEER
Else null.
32. If a grade, CGPA, CPI, GPA, percentage, or letter grade appears in the education section, extract it into the grade field exactly as written (e.g. 7.63/10, 96.2%, A+, First Class). If none exists, return null.

JSON STRUCTURE

{
  "title": string | null,
  "firstName": string | null,
  "middleName": string | null,
  "lastName": string | null,
  "country": string | null,
  "phoneNumber": string | null,
  "resumeEmail": string | null,
  "linkedIn": string | null,
  "github": string | null,
  "personalPortfolio": string | null,
  "leetCode": string | null,
  "codingProfile2": string | null,
  "codingProfile3": string | null,

  "summary": string | null,

  "education": [
    {
      "instituteName": string | null,
      "level": string | null,
      "startDate": string | null,
      "endDate": string | null,
      "location": string | null,
      "degree": string | null,
      "branch": string | null,
      "grade": string | null
    }
  ],

  "experience": [
    {
      "companyName": string | null,
      "location": string | null,
      "type": "INTERNSHIP" | "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE" | "RESEARCH" | "VOLUNTEER" | null,
      "startDate": string | null,
      "endDate": string | null,
      "position": string | null,
      "description": string | null,
      "proofLink": string | null
    }
  ],

  "projects": [
    {
      "projectName": string | null,
      "techStack": string[],
      "description": string | null,
      "githubLink": string | null,
      "liveLink": string | null,
      "startDate": string | null,
      "endDate": string | null
    }
  ],

  "skills": [
    {
      "name": string | null,
      "category": string | null
    }
  ],

  "achievements": [
    {
      "title": string | null,
      "org": string | null,
      "date": string | null,
      "description": string | null
    }
  ],

  "pors": [
    {
      "title": string | null,
      "org": string | null,
      "startDate": string | null,
      "endDate": string | null,
      "description": string | null
    }
  ],

  "publications": [
    {
      "authors": string | null,
      "title": string | null,
      "conference": string | null,
      "place": string | null,
      "publicationDate": string | null,
      "description": string | null
    }
  ]
}

Follow all rules strictly.

RESUME TEXT: ${resumeData}
        
        `
        return prompt

    }


    public async groq(resumeData:string){

        const prompt:string = this.promptBuilder(resumeData)

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



    public async googleGemini(resumeData:string){

        const prompt:string = this.promptBuilder(resumeData)
        
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