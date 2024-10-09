// database/conn.js
import mongoose from 'mongoose';

async function connect() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/smartDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Database Connected to Local MongoDB");
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        process.exit(1); // Thoát chương trình nếu không kết nối được
    }
}
mongoose.set('strictQuery', true);

export default connect;
