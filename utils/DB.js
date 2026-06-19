import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connection = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    if (conn) {
      console.log("MongoDB connected successfully");
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
};

export default connection;
