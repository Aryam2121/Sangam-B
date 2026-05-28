import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

const connectDB = async () => {
    try{
        //console.log(process.env.MONGODB_URI)
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    }catch (error){
        console.log("MONGODB connection FAILED ", error);
        console.log("⚠️ Backend started without database access. Fix MongoDB credentials to enable database features.")
    }
}

export default connectDB