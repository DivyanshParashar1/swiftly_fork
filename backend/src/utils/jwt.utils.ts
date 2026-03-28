import jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import type { User } from '../types/user.types';

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || 'myaccesstoken'
const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || '7d' 


const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || 'myrefreshtoken'
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '15d'

const generateAccessToken = (userId:string)=>{
    return jwt.sign({
        userId: userId,
        role: "user"
    } as JwtPayload,
    accessTokenSecret,{
        expiresIn:accessTokenExpiry
    } as SignOptions)
}


const generateRefreshToken = (userId:string)=>{
    return jwt.sign({
        userId:userId,
        role:"user"

    }as JwtPayload, refreshTokenSecret,
    {
        expiresIn:refreshTokenExpiry
    } as SignOptions)
}



const verifyAccessToken = (token: string): User | null => {
    try {
        const decoded = jwt.verify(token, accessTokenSecret) as any;
        if (decoded && decoded.userId) {
            return decoded as User;
        }
        return null;
    } catch (error) {
        return null;
    }
}


const verifyRefreshToken = (token:string)=>{

    try {       
        const decoded = jwt.verify(token, refreshTokenSecret) as any
        if(decoded && decoded.userId){
            return decoded as User
        }
        return null
    } catch (error) {
        return null
    }
}


export {generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken}