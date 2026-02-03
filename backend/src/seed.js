import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => {
        console.log("MongoDB connection error:", err);
        process.exit(1);
    });

const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: "admin@example.com" });
        if (adminExists) {
            console.log("✓ Admin user already exists");
            console.log("  Email: admin@example.com");
            console.log("  Password: password123");
            process.exit(0);
        }

        const admin = new User({
            name: "Admin User",
            email: "admin@example.com",
            password: "password123",
            role: "ADMIN"
        });

        await admin.save();
        console.log("✓ Admin user created successfully!");
        console.log("  Email: admin@example.com");
        console.log("  Password: password123");
        process.exit(0);
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
};

seedAdmin();
