import { asyncHandler } from "../utils/asyncHandler.utils";
import type { AuthRequest, createUserInput, SignIn } from "../types/auth.types";
import type { CookieOptions, NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { generateOptions, getUserPasskeys, verifyOptions, savePasskeyToDB, generateLoginOptions, getPasskeyAndUserFromCredentialID, verifyLogin, updateCounter } from "../services/passkey.service";
import { ApiResponse } from "../utils/apiResponse.utils";
import type { AuthenticationResponseJSON, RegistrationResponseJSON, VerifiedRegistrationResponse, WebAuthnCredential} from "@simplewebauthn/server";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.utils";
import { options } from "./auth.controller";



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


}) 

export const verifyPasskey = asyncHandler(async(req:AuthRequest, res:Response, next:NextFunction) => {
    const userId = req.userId!
    const credentialPayload = req.body as RegistrationResponseJSON
    const expectedChallenge = req.signedCookies["challenge"]
    
    if(!expectedChallenge){
        return res.status(400).json(new ApiResponse(400, null, "No challenge found"))
    }
    const verification:VerifiedRegistrationResponse = await verifyOptions(credentialPayload, expectedChallenge)

    const {verified, registrationInfo} = verification
    
    if(!verified || !registrationInfo){
        return res.status(400).json(new ApiResponse(400, null, "Passkey verification failed"))
    }

    const {credential, credentialDeviceType, credentialBackedUp} = registrationInfo
    const {id:credentialID, publicKey, counter, transports} = credential  
    await savePasskeyToDB(credentialID, Buffer.from(publicKey), BigInt(counter), transports as string[], credentialDeviceType, userId) 

    res
        .status(200)
        .clearCookie("challenge", {
            domain: ".swiftly.nakshjoshi.in",
            path: "/",
            signed:true,
            secure:true,
            sameSite:"none",
            httpOnly:true
        })
        .json(new ApiResponse(200, null, "Passkey registered successfully"))

    
})

export const getPasskeyLoginOptions =   asyncHandler(async(req:AuthRequest, res:Response, next:NextFunction)=>{
    const loginOptions = await generateLoginOptions()
    return res
            .status(200)
            .cookie("login_challenge", loginOptions.challenge, {
                httpOnly:true,
                secure:true,
                sameSite:"none",
                maxAge:1000*60*5,
                domain:".swiftly.nakshjoshi.in",
                path:"/",
                signed:true
            })
            .json(new ApiResponse(200, loginOptions, "Passkey login options generated successfully"))
})


export const verifyPasskeyLogin = asyncHandler(async(req:AuthRequest, res: Response, next:NextFunction)=>{

    const credentialPayload = req.body as AuthenticationResponseJSON
    const expectedChallenge = req.signedCookies["login_challenge"]
    if(!expectedChallenge){
        return res.status(400).json(new ApiResponse(400, null, "No login challenge found"))
    }

    const credentialID = credentialPayload.id
    const passkeyWithUser = await getPasskeyAndUserFromCredentialID(credentialID)
    if(!passkeyWithUser){
        return res.status(404).json(new ApiResponse(404, null, "Passkey not registered"))
    }   
    const verification = await verifyLogin(credentialPayload, expectedChallenge, passkeyWithUser)
    const {verified, authenticationInfo} = verification
    if(!verified || !authenticationInfo){
        return res.status(400).json(new ApiResponse(400, null, "Invalid Passkey"))
    }

    await updateCounter(credentialID, BigInt(authenticationInfo.newCounter))

    const accessToken = generateAccessToken(passkeyWithUser.userId)
    const refreshToken = generateRefreshToken(passkeyWithUser.userId)

    await authService.saveRefreshToken(passkeyWithUser.userId, refreshToken)

    res
    .status(200)
    .clearCookie("login_challenge",{
        domain: ".swiftly.nakshjoshi.in",
        path: "/",
        signed:true,
        secure:true,
        sameSite:"none",
        httpOnly:true
    })
    .cookie("access_token", accessToken,options)
    .cookie("refresh_token", refreshToken,options)
    .json(new ApiResponse(200, {
        user:passkeyWithUser.user,
        accessToken,
        refreshToken
    }, "Passkey login successful"))
})