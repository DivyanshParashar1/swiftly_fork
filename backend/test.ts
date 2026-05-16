import { LatexExportService } from './src/services/latexExport.service';
import prisma from './src/config/prisma';

async function test() {
    const resume = await prisma.resume.findFirst({
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

    if (!resume) return;

    // Convert Date objects to strings
    const resumeData = JSON.parse(JSON.stringify(resume));

    const service = new LatexExportService();
    try {
        console.log('Compiling from JSON...');
        const buf = await service.exportToPdfFromJson(resumeData);
        console.log('Success, generated PDF of size', buf.length);
    } catch (e: any) {
        console.error('Failed!', e.message);
    }
}

test();
