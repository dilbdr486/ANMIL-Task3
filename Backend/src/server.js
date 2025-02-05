import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import connectDB from "./config/db.js"
import "dotenv/config"
import router from "./routes/userRoute.js"
import session from "express-session"

const port = process.env.PORT || 3001
const app = express()

const allowedOrigins = ['http://localhost:5173'];

app.use(express.json())
app.use(cookieParser())
app.use(cors({origin:allowedOrigins,credentials:true}))

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}))

connectDB();

app.use("/api/users", router)

// app.get("/", (req, res) => {
//     res.send("Hello World!")
// })

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`)
})
