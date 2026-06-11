import { asyncHandler } from "../utils/asyncHandler.utils";
import type { AuthRequest, createUserInput, SignIn } from "../types/auth.types";
import type { CookieOptions, NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { generateOptions, getUserPasskeys, verifOptions, savePasskeyToDB } from "../services/passkey.service";
import { ApiResponse } from "../utils/apiResponse.utils";
import type { RegistrationResponseJSON, VerifiedRegistrationResponse, WebAuthnCredential} from "@simplewebauthn/server";



const authService = new AuthService()

export const setupPasskey = asyncHandler(async(req:AuthRequest, res:Response, next:NextFunction) => {
    const userId = req.userId!
    const user = await authService.getUserById(userId)
    const userPasskeys = await getUserPasskeys(userId)
    if(user){
        const passkeyOptions = await generateOptions(userId, user.email!, user.fullName!, userPasskeys)
        const challenge = passkeyOptions.challenge


        return res
            .status(200)
            .cookie("challenge", challenge, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 1000 * 60 * 5,
                domain: ".swiftly.nakshjoshi.in",
                path: "/",
                signed:true
            })
            .json(new ApiResponse(200, passkeyOptions, "Passkey options generated successfully"))

    }else{
        return res.status(404).json(new ApiResponse(404, null, "User not found"))
    }

    next()
}) 

export const verifyPasskey = asyncHandler(async(req:AuthRequest, res:Response, next:NextFunction) => {
    const userId = req.userId!
    const credentialPayload = req.body as RegistrationResponseJSON
    const expectedChallenge = req.signedCookies["challenge"]
    
    if(!expectedChallenge){
        return res.status(400).json(new ApiResponse(400, null, "No challenge found"))
    }
    const verification:VerifiedRegistrationResponse = await verifOptions(credentialPayload, expectedChallenge)

    const {verified, registrationInfo} = verification
    
    if(!verified || !registrationInfo) {
        return res.status(400).json(new ApiResponse(400, null, "Passkey verification failed"))
    }

    const {credential, credentialDeviceType, credentialBackedUp} = registrationInfo
    const {id:credentialID, publicKey, counter, transports} = credential  
    await savePasskeyToDB(credentialID, publicKey, BigInt(counter), transports as string[], credentialDeviceType, userId) 

    res
        .status(200)
        .clearCookie("challenge", {
            domain: ".swiftly.nakshjoshi.in",
            path: "/",
        })
        .json(new ApiResponse(200, null, "Passkey registered successfully"))

    next()
})