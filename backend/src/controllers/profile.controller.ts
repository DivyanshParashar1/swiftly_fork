import { ResumeService } from "../services/resume.service";
import type { AuthRequest } from "../types/auth.types";
import { ApiResponse } from "../utils/apiResponse.utils";
import type { CookieOptions, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.utils";
import { AuthService } from "../services/auth.service";

const resumeService = new ResumeService()
const authService = new AuthService()



export const getUserProfile = asyncHandler(async(req:AuthRequest, res: Response)=>{
    const userId = req.userId!
    const profile = await authService.getUserById(userId)
    return profile
        ? res.status(200).json(new ApiResponse(200, profile, "User profile fetched successfully"))
        : res.status(404).json(new ApiResponse(404, null, "User not found"))
})


export const fetchResumeForUser = asyncHandler(async(req:AuthRequest, res: Response)=>{
    
    const userId = req.userId!
    const result = await resumeService.fetchResumeForUser(userId)

    // console.log(userId, result)


    return res
        .status(200)
        .json(new ApiResponse(200, result, "Resume fetched successfully"))

})  


export const fetchFullDetailsOfOneResume = asyncHandler(async(req:AuthRequest, res: Response)=>{
    const userId = req.userId!
    const resumeId = req.params.resumeId

    const result = await resumeService.fetchOneFullResumeForUser(userId, resumeId as string)

    // console.log(result[0])

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Resume fetched successfully"))
})


export const deleteResumeForUser = asyncHandler(async(req:AuthRequest, res:Response)=>{
    const userId = req.userId!
    const resumeId = req.params.resumeId

    const result = await resumeService.deleteResumeForUser(userId, resumeId as string)

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Resume deleted successfully"))

})