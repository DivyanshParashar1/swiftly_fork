import { Router } from "express";
import { googleAuth, logout, signIn, signUp, refreshToken } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getUserProfile } from "../controllers/profile.controller";


const authRouter = Router()

authRouter.route('/signup').post(signUp)
authRouter.route('/signin').post(signIn)
authRouter.route('/google/callback/').get(googleAuth)


authRouter.route('/refresh').post(refreshToken)
authRouter.route('/logout').post(authMiddleware, logout)
authRouter.route('/userProfile').get(authMiddleware, getUserProfile)
export default authRouter;