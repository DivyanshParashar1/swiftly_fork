import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.utils';
import { verifyAccessToken } from '../utils/jwt.utils';
import type { AuthRequest } from '../types/auth.types';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        
        const tokenFromCookie = req.cookies?.accessToken
        const tokenFromHeader = req.header("Authorization")?.replace("Bearer ", "")


    
        const token = tokenFromCookie || tokenFromHeader
        if(!token){
            throw new ApiError(401, "unauthorized request")
        }

        const decoded = verifyAccessToken(token)

    
        if(!decoded){
            throw new ApiError(401, "Unauthorized Request: Invalid Token")
        }
        
        req.userId = decoded.userId;
         
        
    
        next();
    } catch (error) {

        throw new ApiError(401, "Unauthorized Request")
        
    }
}