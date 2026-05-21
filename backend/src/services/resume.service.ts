import fs from 'node:fs'
import prisma from "../config/prisma";
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import { ApiError } from '../utils/apiError.utils';


export class ResumeService{ 



    public async pushLlmJsonOfResumeToRespectiveDbTables(userId:string, llmJson:string){
        let jsonDataResume
        
        try {
            jsonDataResume = JSON.parse(llmJson)
        } catch (error) {

            throw new ApiError(400, "Invalid Json Data")
            
        }

        const result = await prisma.resume.create({
            data:{
                userId: userId,
                title: jsonDataResume.title ||"Resume 1",
                firstName: jsonDataResume.firstName,
                middleName: jsonDataResume.middleName,
                lastName: jsonDataResume.lastName,
                country:jsonDataResume.country,
                phoneNumber:jsonDataResume.phoneNumber,
                resumeEmail:jsonDataResume.resumeEmail,
                linkedIn: jsonDataResume.linkedIn,
                github:jsonDataResume.github,
                personalPortfolio:jsonDataResume.personalPortfolio,
                leetCode:jsonDataResume.leetCode,
                codingProfile2:jsonDataResume.codingProfile2,
                codingProfile3:jsonDataResume.codingProfile3,
                summary:jsonDataResume.summary,
                dateOfBirth:jsonDataResume.dateOfBirth ?? undefined,
                address:jsonDataResume.address ?? undefined,
                yearOfGraduation:jsonDataResume.yearOfGraduation ?? undefined,

                education: jsonDataResume.education?.length
                  ? { create: jsonDataResume.education }
                  : undefined,

                experience: jsonDataResume.experience?.length
                  ? { create: jsonDataResume.experience }
                  : undefined,

                projects: jsonDataResume.projects?.length
                  ? { create: jsonDataResume.projects }
                  : undefined,

                skills: jsonDataResume.skills?.length
                  ? { create: jsonDataResume.skills }
                  : undefined,

                achievements: jsonDataResume.achievements?.length
                  ? { create: jsonDataResume.achievements }
                  : undefined,

                pors: jsonDataResume.pors?.length
                  ? { create: jsonDataResume.pors }
                  : undefined,

                publications: jsonDataResume.publications?.length
                  ? { create: jsonDataResume.publications }
                  : undefined


            }
        })
        return result


    }

    public async parsePDF(resumePath:string){
        const bufferFile = await fs.promises.readFile(resumePath)
        const parser = new PDFParse({data: bufferFile})
        const resumeText = (await parser.getText()).text
        const resumeLinks = (await parser.getInfo({ parsePageInfo: true })).pages[0]?.links
        await parser.destroy()


        return `${resumeText} and ${JSON.stringify(resumeLinks)}`


        // return `${typeof(resumeText) } and ${typeof(resumeLinks)}`
        // return resumeText.text
        // return "Hi PDF"
        // return resumeInfo.pages[0]?.links


    }

    public async parseDocx(resumePath:string){

        // const bufferFile = await fs.promises.readFile(resumePath);
        const resumeText = await mammoth.convertToHtml({path: resumePath})



        return resumeText.value

    }


    public cleanLatex(text: string) {

        const start = text.indexOf("\\begin{document}")
        if (start !== -1) {
            text = text.slice(start)
        }

        return text
            .replace(/\\href\{(.*?)\}\{(.*?)\}/g, "$2: $1")
            .replace(/\\section\{(.*?)\}/g, "\n$1\n")
            .replace(/\\textbf\{(.*?)\}/g, "$1")
            .replace(/\\emph\{(.*?)\}/g, "$1")
}

    public async parseTex(resumePath:string){


        


        const text = await fs.promises.readFile(resumePath, "utf-8")
        return this.cleanLatex(text)
    }


    public async fetchResumeForUser(userId:string){

    
        const result = await prisma.resume.findMany({
            where:{
                userId: userId
            }
        }
        )

        return result

    }

    public async fetchOneFullResumeForUser(userId:string, resumeId:string){

    
        const result = await prisma.resume.findMany({
            where:{
                userId: userId,
                id: resumeId
            },
            include:{
                education: true,
                experience: true,
                projects: true,
                skills: true,
                achievements: true,
                pors: true,
                publications: true
            }
        }
        )

        return result

    }
    

    public async deleteResumeForUser(userId:string, resumeId:string){

    
        const result = await prisma.resume.delete({
            where:{
                userId: userId,
                id: resumeId
            }
        }
        )

        return result

    }

    




}