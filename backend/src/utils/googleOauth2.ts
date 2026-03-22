import {google} from 'googleapis'

export const googleClientId = process.env.GOOGLE_CLIENT_ID
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

export const googleOAuth2Client = new google.auth.OAuth2(googleClientId, googleClientSecret, 'postmessage')