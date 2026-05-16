import type { AchievementsTable, EducationTable, ExperienceTable, PorTable, ProjectsTable, PublicationsTable, ResumeTable, SkillsTable } from "../types/db.types";
import prisma from "../config/prisma";
import type { Education } from "../../generated/prisma/browser";


export class ProfileUpdate{
    public async updateResumeTable(user:string, resume:string, data:ResumeTable){

        const {title, firstName, middleName, lastName, country, phoneNumber, resumeEmail, linkedIn, github, personalPortfolio, leetCode, codingProfile2, codingProfile3, summary, dateOfBirth, address, yearOfGraduation }= data

        const result = await prisma.resume.update({

            where: {
                userId: user,
                id: resume
            },
            data:{
                ...(title && {title}),
                ...(firstName && {firstName}),
                ...(middleName && {middleName}),
                ...(lastName && {lastName}),
                ...(country && {country}),
                ...(phoneNumber && {phoneNumber}),
                ...(resumeEmail && {resumeEmail}),
                ...(linkedIn && {linkedIn}),
                ...(github && {github}),
                ...(personalPortfolio && {personalPortfolio}),
                ...(leetCode && {leetCode}),
                ...(codingProfile2 && {codingProfile2}),
                ...(codingProfile3 && {codingProfile3}),
                ...(summary && {summary}),
                ...(dateOfBirth && {dateOfBirth}),
                ...(address && {address}),
                ...(yearOfGraduation && {yearOfGraduation})
            }
        })

        return result
    }


    public async updateEducationTable(resume:string, educationId:string, data:EducationTable){

        const {instituteName, level, startDate, endDate, location, degree, branch, grade} = data

        const result = await prisma.education.update({

            where: {
                id: educationId,
                resumeId: resume
            },
            data:{
                ...(instituteName && {instituteName}),
                ...(level && {level}),
                ...(startDate && {startDate}),
                ...(endDate && {endDate}),
                ...(location && {location}),
                ...(degree && {degree}),
                ...(branch && {branch}),
                ...(grade && {grade})
            }
        })

        return result
    }

    public async updateExperienceTable(resume:string, experienceId:string, data:ExperienceTable){

        const {companyName, location, type, startDate, endDate, position, description, proofLink} = data

        const result = await prisma.experience.update({

            where: {
                id: experienceId,
                resumeId: resume
            },
            data:{
                ...(companyName && {companyName}),
                ...(location && {location}),
                ...(type && {type}),
                ...(startDate && {startDate}),
                ...(endDate && {endDate}),
                ...(position && {position}),
                ...(description && {description}),
                ...(proofLink && {proofLink})
            }
        })

        return result
    }

     public async updateProjectsTable(resume:string, projectId:string, data:ProjectsTable){

        const {projectName, techStack, description, githubLink, liveLink, startDate, endDate} = data

        const result = await prisma.projects.update({

            where: {
                id: projectId,
                resumeId: resume
            },
            data:{
                ...(projectName && {projectName}),
                ...(techStack && {techStack}),
                ...(description && {description}),
                ...(githubLink && {githubLink}),
                ...(liveLink && {liveLink}),
                ...(startDate && {startDate}),
                ...(endDate && {endDate})
            }
        })

        return result
    }

    public async updateSkillsTable(resume:string, skillId:string, data:SkillsTable){

        const {name, category} = data

        const result = await prisma.skills.update({

            where: {
                id: skillId,
                resumeId: resume
            },
            data:{
                ...(name && {name}),
                ...(category && {category})
            }
        })

        return result
    }

    public async updateAchievementsTable(resume:string, achievementId:string, data:AchievementsTable){

        const {title, org, date, description} = data

        const result = await prisma.achievements.update({

            where: {
                id: achievementId,
                resumeId: resume
            },
            data:{
                ...(title && {title}),
                ...(org && {org}),
                ...(date && {date}),
                ...(description && {description})
            }
        })

        return result
    }


    public async updatePorTable(resume:string, porId:string, data:PorTable){

        const {title, org, startDate, endDate, description} = data

        const result = await prisma.por.update({

            where: {
                id: porId,
                resumeId: resume
            },
            data:{
                ...(title && {title}),
                ...(org && {org}),
                ...(startDate && {startDate}),
                ...(endDate && {endDate}),
                ...(description && {description})
            }
        })

        return result
    }


    public async updatePublicationsTable(resume:string, publicationId:string, data:PublicationsTable){

        const {authors, title, conference, place, publicationDate, description} = data

        const result = await prisma.publications.update({

            where: {
                id: publicationId,
                resumeId: resume
            },
            data:{
                ...(authors && {authors}),
                ...(title && {title}),
                ...(conference && {conference}),
                ...(place && {place}),
                ...(publicationDate && {publicationDate}),
                ...(description && {description})
            }
        })

        return result
    }
    

    public async updateFullResumeTree(user: string, resumeId: string, fullData: any) {
        const { id, userId, createdAt, updatedAt, education, experience, projects, skills, achievements, pors, publications, ...scalarData } = fullData;

        // Strip IDs from arrays to allow Prisma create to generate new ones
        const stripIds = (arr: any[]) => arr?.map(({ id, resumeId, ...rest }) => rest) || [];

        return prisma.resume.update({
            where: { id: resumeId, userId: user },
            data: {
                ...scalarData,
                education: { deleteMany: {}, create: stripIds(education) },
                experience: { deleteMany: {}, create: stripIds(experience) },
                projects: { deleteMany: {}, create: stripIds(projects) },
                skills: { deleteMany: {}, create: stripIds(skills) },
                achievements: { deleteMany: {}, create: stripIds(achievements) },
                pors: { deleteMany: {}, create: stripIds(pors) },
                publications: { deleteMany: {}, create: stripIds(publications) },
            },
            include: {
                education: true,
                experience: true,
                projects: true,
                skills: true,
                achievements: true,
                pors: true,
                publications: true,
            }
        });
    }

}