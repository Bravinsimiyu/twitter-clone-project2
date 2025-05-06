import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import connectMongoDB from './db/connectMongoDB.js';
import cookieParser from 'cookie-parser';

 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// console.log(process.env.MONGO_URI);

app.use(express.json()); // Middleware to parse JSON request bodies req.body
app.use(express.urlencoded({ extended: true })); // Middleware to parse form data (URL-encoded request bodies req.body)

app.use(cookieParser()); // Middleware to parse cookies in request headers req.cookies


app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})