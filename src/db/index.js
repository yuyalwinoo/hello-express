import mongoose from 'mongoose';

const DB_NAME = 'helloExpressDB';

export const connectDB = async ()=>{
    try {
        const connectionResponse = await mongoose.connect(`${process.env.DB_CONNECTION_URI}${DB_NAME}`);
        console.log("MongoDB connected! ", connectionResponse.connection.host)
    } catch (error) {
        console.log("DB connection error",error);
        process.exit(1);
    }

}