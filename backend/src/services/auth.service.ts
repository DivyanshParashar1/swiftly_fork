import prisma from "../config/prisma";
import type { createUserInput } from "../types/auth.types";
import { ApiError } from "../utils/apiError.utils";
import { hash, hashPassword, verifyHash } from "../utils/bcrypt.utils";



export class AuthService{

    public async findUserbyEmail(email:string){
        try {
            const user = await prisma.user.findUnique({
                where:{email:email}
            })
    
            return user;
        } catch (error) {
            
            throw new ApiError(404,"connection to DB failed")
            
        }
        
    }

    public async findSessionByUserIdAndToken(userId:string, token:string){
        try {
            const sessions = await prisma.session.findMany({
                where:{userId:userId}
            })

            for (const session of sessions) {
                const isValid = await verifyHash(token, session.refreshToken)
                if (isValid) {
                    return session
                }
            }

            return null;
        } catch (error) {
            
            throw new ApiError(404,"connection to DB failed")
            
        }
    }

    public async deleteSessionById(sessionId:string){
        return await prisma.session.delete({
            where:{id:sessionId}
        })
    }


    public async createUser(data:createUserInput){



        if(data.provider=="credentials"){            

            if(data.hashedPassword){
                let newHashedPassword = await hashPassword(data.hashedPassword)
                data.hashedPassword = newHashedPassword
            }

            return await prisma.$transaction(async(tx)=>{

            const existingUser = await tx.user.findUnique({
                where:{email:data.email}
            })

            

            if(existingUser){
                
                const authAccountCrendential = await tx.authAccount.findUnique({
                    where:{
                        userId_provider:{
                            userId: existingUser.id,
                            provider: "credentials"
                        }
                    }
                })

                if(authAccountCrendential){
                    throw new ApiError(409, "User already exists with same email id")
                }
                
                const authAccountGoogle = await tx.authAccount.findUnique({
                    where:{
                        userId_provider:{
                            userId: existingUser.id,
                            provider: "google"
                        }
                    }
                })

                if(authAccountGoogle){
                    await tx.authAccount.create({
                        data:{
                            userId: existingUser.id,
                            provider:"credentials",
                            passwordHash: data.hashedPassword
                        }
                    })

                    return existingUser
                }

                throw new ApiError(409, "User already exists with same email id")
            }

            
            //create user

            const Newuser = await tx.user.create({
                data:{
                    email: data.email,
                    fullName: data.fullName,
                    phone:data.phone,
                    avatarUrl:"https://static.vecteezy.com/system/resources/previews/021/548/095/non_2x/default-profile-picture-avatar-user-avatar-icon-person-icon-head-icon-profile-picture-icons-default-anonymous-user-male-and-female-businessman-photo-placeholder-social-network-avatar-portrait-free-vector.jpg"

                }
            })


            // create auth account with credentials
            await tx.authAccount.create({
                    data:{
                        userId: Newuser.id,
                        provider:"credentials",
                        passwordHash: data.hashedPassword
                    }
                })

            return Newuser

        })

        }

        if(data.provider=="google"){

            


            return await prisma.$transaction(async(tx)=>{


                const existingUser = await tx.user.findUnique({
                where:{email:data.email}
                })

            if(existingUser){                


                //check if credentials auth exists for existing user
                const authAccountCrendential = await tx.authAccount.findUnique({
                    where:{
                        userId_provider:{
                            userId: existingUser.id,
                            provider: "credentials"
                        }
                    }
                })

                //check if google auth exists for existing user
                const authAccountGoogle = await tx.authAccount.findUnique({
                    where:{
                        userId_provider:{
                            userId: existingUser.id,
                            provider: "google"
                        }
                    }
                })

                if(authAccountCrendential && !authAccountGoogle){

                    //add a row with google auth for existing user
                    const newGoogleAuthForExistingUser = await tx.authAccount.create({
                        data:{
                            userId: existingUser.id,
                            provider:"google",
                            providerId: data.providerId
                        }
                    })


                    //update avatarurl with google avatar
                    const updateAvatar = await tx.user.update({
                        where:{id:existingUser.id},
                        data:{avatarUrl:data.avatar}
                    })

                    return existingUser
                }
                
                

                //if google auth already exists, return existing user
                if(authAccountGoogle){
                    return existingUser
                }

                throw new ApiError(409, "User already exists with same email id")
            }

            //create user
            
            const Newuser = await tx.user.create({
                data:{
                    email: data.email,
                    fullName: data.fullName,
                    avatarUrl:data.avatar,

                }
            })


            // create auth account with google
            await tx.authAccount.create({
                    data:{
                        userId: Newuser.id,
                        provider:"google",
                        providerId: data.providerId
                    }
                })

            return Newuser

        })
            
            
        }
    }


    public async saveRefreshToken(userId:string, token:string){

        const hashedToken = await hash(token)
        const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)

        return await prisma.session.create({
            data:{
                userId:userId,
                refreshToken: hashedToken,
                expiresAt: expiresAt
            }
        })
    }
    
    public async deleteRefreshToken(userId:string, token:string){

        const sessions = await prisma.session.findMany({
            where:{userId:userId}
        })

        for(const session of sessions){
            const isValid = await verifyHash(token, session.refreshToken)

            if(isValid){
                await prisma.session.delete({
                    where:{id:session.id}
                })
            }
        }
        
    }


    public async getUserAuthAccount(userId:string, provider:string){
        return await prisma.authAccount.findUnique({
            where:{

                userId_provider:{
                userId:userId,
                provider:provider
                }
            }
        })
    }


    public async getUserById(userId:string){
        return await prisma.user.findUnique({
            where:{id:userId}
        })
    }
}