import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import connectDB from "./config/db.js"
import "dotenv/config"
import router from "./routes/userRoute.js"

const port = process.env.PORT || 3001
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({credentials:true}))

connectDB();

app.use("/api/users", router)

// app.get("/", (req, res) => {
//     res.send("Hello World!")
// })

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`)
})
