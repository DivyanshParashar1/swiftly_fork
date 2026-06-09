import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";

const passkeyRouter = Router()

passkeyRouter.route('/generate-passkey-options').get(authMiddleware,)
passkeyRouter.route('/setup-passkey').post(authMiddleware,)

export default passkeyRouter