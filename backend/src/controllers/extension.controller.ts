import { log } from "console";
import { ExtensionAiService } from "../services/extension.ai.service";
import type { HTMLObjectAttributes } from "../types/htmlObjectAttributes.types";
import { asyncHandler } from "../utils/asyncHandler.utils";

const extensionAiService = new ExtensionAiService()

type AutofillRequestBody = {
    resumeData: unknown
    htmlObjectData?: HTMLObjectAttributes[]
}

export const getObjectForAutofill = asyncHandler(async(req, res)=>{
    const { resumeData, htmlObjectData = [] } = req.body as AutofillRequestBody    

    const aiResultText = await extensionAiService.googleGemini(
        resumeData,
        htmlObjectData
    ) 
    
    const aiResult = JSON.parse(aiResultText) 
    console.log(aiResult);
    res.json({ aiResult })
})