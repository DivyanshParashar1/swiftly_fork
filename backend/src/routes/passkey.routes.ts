import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { setupPasskey, verifyPasskey } from "../controllers/passkey.controller";

const passkeyRouter = Router()

passkeyRouter.route('/generate-passkey-options').get(authMiddleware, setupPasskey)
passkeyRouter.route('/verify-passkey').post(authMiddleware,)

export default passkeyRouter