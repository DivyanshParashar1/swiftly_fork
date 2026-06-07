import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";

const passkeyRouter = Router()

passkeyRouter.route('/setup-passkey').get()
passkeyRouter.route('/setup-passkey').post()
