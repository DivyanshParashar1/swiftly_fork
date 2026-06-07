import { generateRegistrationOptions } from "@simplewebauthn/server";

async function generateOptions(userId:string, userEmail:string, fullName:string, userPasskeys:Array<{credentialID:string, userId:string}>) {


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


