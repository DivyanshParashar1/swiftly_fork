import type { CookieOptions, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.utils";
import type { AuthRequest, createUserInput, SignIn } from "../types/auth.types";
import { ApiError } from "../utils/apiError.utils";
import { AuthService } from "../services/auth.service";
import { ApiResponse } from "../utils/apiResponse.utils";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.utils";
import { verifyHash, verifyPassword } from "../utils/bcrypt.utils";
import { googleClientId, googleOAuth2Client } from "../utils/googleOauth2";
import { log } from "node:console";


const Auth = new AuthService()
const options: CookieOptions = {
    httpOnly: true,
    secure: true,
    // sameSite: "none",
    // domain: ".swiftly.nakshjoshi.in",
    path: "/",
}

export const signUp = asyncHandler(async (req: Request, res: Response) => {

    console.log(req.body)

    const { email, fullName, phone, provider, providerId, hashedPassword }: createUserInput = req.body

    if (!email?.trim() || !fullName?.trim() || (!hashedPassword?.trim() && !providerId?.trim())) {
        throw new ApiError(400, "Please fill mandatory field")
    }


    const data: createUserInput = {
        email: email.trim().toLowerCase(),
        fullName,
        phone,
        provider,
        providerId,
        hashedPassword,
    } as createUserInput


    const createdUser = await Auth.createUser(data)
    const accessToken = generateAccessToken(createdUser!.id)
    const refreshToken = generateRefreshToken(createdUser!.id)

    await Auth.saveRefreshToken(createdUser!.id, refreshToken)

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(201, createdUser, "User registered successfully"))

})


export const signIn = asyncHandler(async (req: Request, res: Response) => {

    // console.log(req.body)

    const { email, hashedPassword, provider }: SignIn = req.body

    if (!email?.trim() || !hashedPassword?.trim()) {
        throw new ApiError(400, "Email and Password are required")
    }

    const userData: SignIn = {
        email: email.trim().toLowerCase(),
        hashedPassword: hashedPassword,
        provider: provider || "credentials"
    }

    const user = await Auth.findUserbyEmail(userData.email)


    if (!user) {
        throw new ApiError(400, "user does not exist")
    }
    const userAuthDetails = await Auth.getUserAuthAccount(user?.id as string, userData.provider || "credentials")

    if (!userAuthDetails) {
        throw new ApiError(400, "password login not available for this user, please use your google account to login")
    }

    const isPasswordValid = await verifyPassword(userData.hashedPassword, userAuthDetails?.passwordHash as string)

    if (isPasswordValid) {
        const accessToken = generateAccessToken(user.id)
        const refreshToken = generateRefreshToken(user.id)
        await Auth.saveRefreshToken(user.id, refreshToken)

        res
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(201, user, "loggedIn"))

    }

    if (!isPasswordValid) {
        throw new ApiError(401, "Wrong Password")
    }

})


export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {

    const userId = req.userId

    if (req.cookies.refreshToken) {
        await Auth.deleteRefreshToken(userId, req.cookies.refreshToken)
    }


    res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(`cookies cleared for user`)




})


export const googleAuth = asyncHandler(async (req: AuthRequest, res: Response) => {

    const googleCode = req.query.code

    const googleTokens = await googleOAuth2Client.getToken(googleCode as string)

    const ticket = await googleOAuth2Client.verifyIdToken({
        idToken: googleTokens.tokens.id_token!,
        audience: googleClientId

    })

    const payload = ticket.getPayload()

    if (payload?.email_verified) {
        const email = payload.email
        const fullName = payload.name
        const providerId = payload.sub
        const avatar = payload.picture


        const data: createUserInput = {
            email: email,
            fullName: fullName,
            provider: "google",
            providerId: providerId,
            avatar: avatar
        } as createUserInput


        const user = await Auth.createUser(data)

        // log("This is the user returned from google auth",user)

        const accessToken = generateAccessToken(user!.id)
        const refreshToken = generateRefreshToken(user!.id)

        await Auth.saveRefreshToken(user!.id, refreshToken)

        return res
            .status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(201, user, "User registered successfully"))






    } else {
        throw new ApiError(400, "Google account email not verified")
    }



})


export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {

    const refreshTokenFromCookie = req.cookies.refreshToken
    const refreshTokenFromHeader = req.header("Authorization")?.replace("Bearer ", "")

    const refreshToken = refreshTokenFromCookie || refreshTokenFromHeader

    if (!refreshToken) {
        throw new ApiError(401, "Refresh token not found, please login again")
    }

    const decoded = verifyRefreshToken(refreshToken)

    if (!decoded) {
        throw new ApiError(401, "Invalid refresh token, please login again")
    }

    const userId = decoded.userId

    const matchedSession = await Auth.findSessionByUserIdAndToken(userId, refreshToken)

    if (!matchedSession) {
        throw new ApiError(401, "Session not found, please login again")
    }

    const isTokenValid = await verifyHash(refreshToken, matchedSession.refreshToken)

    const options: CookieOptions = {
        httpOnly: true,
        secure: true,
        // sameSite: "none",
        // domain: ".swiftly.nakshjoshi.in",
        path: "/",
    }

    if (!isTokenValid) {
        throw new ApiError(401, "Invalid refresh token, please login again")
    }

    if (matchedSession.expiresAt < new Date()) {
        await Auth.deleteSessionById(matchedSession.id)
        res.clearCookie("refreshToken", options).clearCookie("accessToken", options)
        throw new ApiError(401, "Refresh token expired, please login again")
    }

    const accessToken = generateAccessToken(matchedSession.userId)
    const newRefreshToken = generateRefreshToken(matchedSession.userId)

    await Auth.deleteSessionById(matchedSession.id)
    await Auth.saveRefreshToken(matchedSession.userId, newRefreshToken)

    return res
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, null, "Token refreshed successfully"))

})