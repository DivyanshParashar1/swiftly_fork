import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse, type RegistrationResponseJSON } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture, PublicKeyCredentialRequestOptionsJSON, VerifiedRegistrationResponse, WebAuthnCredential } from "@simplewebauthn/server";
import prisma from "../config/prisma";
import type { Bytes } from "@prisma/client/runtime/client";
import type { Passkey } from "../../generated/prisma/browser";


// methods for passkey registration

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


export async function verifyOptions(credentialPayload:RegistrationResponseJSON, expectedChallenge:string, ): Promise<VerifiedRegistrationResponse> {
    const verification = await verifyRegistrationResponse({
        response: credentialPayload,
        expectedChallenge,
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


// methods for passkey login

export async function generateLoginOptions(): Promise<PublicKeyCredentialRequestOptionsJSON>{
    return await generateAuthenticationOptions({
        rpID: process.env.DOMAIN_NAME as string || "localhost",
        userVerification: "preferred",
    })
}

export async function getPasskeyAndUserFromCredentialID(credentialID:string){

    return await prisma.passkey.findUnique({
        where:{credentialID},
        include:{user:true}
    })



}

export async function updateCounter(credentialID:string, counter:bigint){
    await prisma.passkey.update({
        where:{credentialID},
        data:{counter:counter}
    })

}


export async function verifyLogin(credentialPayload:AuthenticationResponseJSON, expectedChallenge:string, savedPasskey:Passkey){

    const credential:WebAuthnCredential ={
        id:savedPasskey.id,
        publicKey: new Uint8Array(savedPasskey.publicKey),
        counter: Number(savedPasskey.counter),
        transports: savedPasskey.name?.split(', ') as AuthenticatorTransportFuture[]
    }
    return await verifyAuthenticationResponse({
        response: credentialPayload,
        expectedChallenge,
        expectedOrigin:process.env.FRONTEND_URL as string || "http://localhost:3000",
        expectedRPID: process.env.DOMAIN_NAME as string || "localhost",
        credential        
    })
}