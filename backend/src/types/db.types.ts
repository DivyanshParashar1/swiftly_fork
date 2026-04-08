import type { ExperienceType } from "../../generated/prisma/enums";

export type ResumeTable = {
    title?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    country?: string | null;
    phoneNumber?: string | null;
    resumeEmail?: string | null;
    linkedIn?: string | null;
    github?: string | null;
    personalPortfolio?: string | null;
    leetCode?: string | null;
    codingProfile2?: string | null;
    codingProfile3?: string | null;
    summary?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
    yearOfGraduation?: number | null;

};

export type EducationTable = {
    instituteName?: string | null;
    level?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    location?: string | null;
    degree?: string | null;
    branch?: string | null;
    grade?: string | null;
};

export type ExperienceTable = {
    companyName?: string | null;
    location?: string | null;
    type?: ExperienceType;
    startDate?: string | null;
    endDate?: string | null;
    position?: string | null;
    description?: string | null;
    proofLink?: string | null;
};

export type ProjectsTable = {
    projectName?: string | null;
    techStack?: string[];
    description?: string | null;
    githubLink?: string | null;
    liveLink?: string | null;
    startDate?: string | null;
    endDate?: string | null;
};

export type SkillsTable = {
    name?: string | null;
    category?: string | null;
};

export type AchievementsTable = {
    title?: string | null;
    org?: string | null;
    date?: string | null;
    description?: string | null;
};

export type PorTable = {
    title?: string | null;
    org?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    description?: string | null;
};

export type PublicationsTable = {
    authors?: string | null;
    title?: string | null;
    conference?: string | null;
    place?: string | null;
    publicationDate?: string | null;
    description?: string | null;
};

// export type ResumeUpdatePayload = {
//     resume?: ResumeTable;
//     education?: EducationTable[];
//     experience?: ExperienceTable[];
//     projects?: ProjectsTable[];
//     skills?: SkillsTable[];
//     achievements?: AchievementsTable[];
//     pors?: PorTable[];
//     publications?: PublicationsTable[];
// };