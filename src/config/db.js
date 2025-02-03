import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => console.log('Connected to MongoDB')
        );
        await mongoose.connect(`${process.env.DB_URL}/auth`)
    } catch (error) {
        
    }
};

export default connectDB;