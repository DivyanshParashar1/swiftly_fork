import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.routes'
import resumeRouter from './routes/resume.routes'
import cors from "cors"
import updateRouter from './routes/update.routes'
import fetchRouter from './routes/fetch.routes'
import extensionRouter from './routes/extension.route'
import migrateRouter from './routes/migrate.routes'


const port = process.env.PORT || 3001


const app = express()

app.use(cors({
    origin:["https://swiftly.nakshjoshi.in","http://localhost:3000"],
    // origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())


app.use('/api/v1/auth', authRouter)
app.use('/api/v1/resume', resumeRouter)
app.use('/api/v1/update', updateRouter)
app.use('/api/v1/fetch', fetchRouter)
app.use('/api/v1/extension', extensionRouter)
app.use('/api/v1/migrate', migrateRouter)

app.get('/health', (req,res)=>{
    res.send('Health Check Ok!')
})

app.listen(port, ()=>{
    console.log(`App running on http://localhost:${port}`)
})

// console.log(generateOtp())

// console.log(accessTokenSecret, refreshTokenSecret)