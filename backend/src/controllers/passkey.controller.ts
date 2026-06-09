import { asyncHandler } from "../utils/asyncHandler.utils";
import type { AuthRequest, createUserInput, SignIn } from "../types/auth.types";
import type { CookieOptions, Request, Response } from "express";
import { AuthService } from "../services/auth.service";


const authService = new AuthService()


export const generatePasskeyOptions = asyncHandler((req:AuthRequest, res:Response) => {
    const user = req.userId


})

export const setupPasskey = asyncHandler((req:AuthRequest, res:Response) => {
    const user = req.userId!
    const userDetails = await authService.getUserById(user)

})