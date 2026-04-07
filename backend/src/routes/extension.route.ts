import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getObjectForAutofill } from "../controllers/extension.controller";

const extensionRouter = Router()

extensionRouter.route('/getAutofillData').post(authMiddleware, getObjectForAutofill)

export default extensionRouter;