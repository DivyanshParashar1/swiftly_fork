import { generateRegistrationOptions, verifyRegistrationResponse, type RegistrationResponseJSON } from "@simplewebauthn/server";
import type { VerifiedRegistrationResponse } from "@simplewebauthn/server";
import prisma from "../config/prisma";
import type { Bytes } from "@prisma/client/runtime/client";

export async function generateOptions(userId:string, userEmail:string, fullName:string, userPasskeys:Array<{credentialID:string, userId:string}>) {


    const encodedId = new TextEncoder().encode(userId);
    const options = await generateRegistrationOptions({
        rpName:"Swiftly",
        rpID:"localhost",
        userID: encodedId,
        userName: userEmail,
        userDisplayName: `${fullName} - ${userEmail}`,

        excludeCredentials: userPasskeys.map(passkey => ({
            id: passkey.credentialID,
            type :'public-key',
            
        })),
        authenticatorSelection: {
            residentKey: 'required',
            userVerification: 'preferred',
        },
        attestationType: 'none'        
    })
    return options
}



export async function getUserPasskeys(userId:string){
    return await prisma.passkey.findMany({
        where:{
            userId:userId
        },
        select:{
            credentialID:true,
            userId:true
        }
    })
}


export async function verifOptions(credentialPayload:RegistrationResponseJSON, challengeFromCookie:string, ): Promise<VerifiedRegistrationResponse> {
    const verification = await verifyRegistrationResponse({
        response: credentialPayload,
        expectedChallenge:challengeFromCookie,
        expectedOrigin:process.env.FRONTEND_URL as string || "http://localhost:3000",
        expectedRPID: process.env.DOMAIN_NAME as string || "localhost",

    })

    return verification
    
}


export async function savePasskeyToDB(credentialID:string, publicKey:Bytes, counter:bigint, transports:string[], credentialDeviceType:string, userId:string){

    await prisma.passkey.create({
        data:{
            credentialID,
            publicKey,
            counter,
            name:transports.join(', '),
            deviceType:credentialDeviceType,
            userId:userId,
        }

    })

}