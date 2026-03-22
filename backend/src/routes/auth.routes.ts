import { Router } from "express";
import { googleAuth, logout, signIn, signUp } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";


const authRouter = Router()

authRouter.route('/signup').post(signUp)
authRouter.route('/signin').post(signIn)
authRouter.route('/google/callback/').get(googleAuth)



authRouter.route('/logout').post(authMiddleware, logout)

export default authRouter;