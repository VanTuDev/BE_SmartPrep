// conn.js
import mongoose from "mongoose";

async function connect() {
    mongoose.set('strictQuery', true);
    // const db = await mongoose.connect(ENV.ATLAS_URI);  // Loại bỏ kết nối Atlas
    const db = await mongoose.connect('mongodb://127.0.0.1:27017/smartDB', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log("Database Connected to Local MongoDB");
    return db;
}

export default connect;
