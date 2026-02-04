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

const seedUsers = async () => {
    try {
        // Seed Admin
        const adminExists = await User.findOne({ email: "admin@example.com" });
        if (!adminExists) {
            const admin = new User({
                name: "Admin User",
                email: "admin@example.com",
                password: "password123",
                role: "ADMIN"
            });
            await admin.save();
            console.log("✓ Admin user created successfully!");
        } else {
            console.log("✓ Admin user already exists");
        }
        console.log("  Email: admin@example.com");
        console.log("  Password: password123");

        // Seed Coordinator
        const coordinatorExists = await User.findOne({ email: "coordinator@example.com" });
        if (!coordinatorExists) {
            const coordinator = new User({
                name: "Coordinator User",
                email: "coordinator@example.com",
                password: "password123",
                role: "COORDINATOR",
                coordinatorOf: "CSE" // Example department
            });
            await coordinator.save();
            console.log("✓ Coordinator user created successfully!");
        } else {
            console.log("✓ Coordinator user already exists");
        }
        console.log("  Email: coordinator@example.com");
        console.log("  Password: password123");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding users:", error);
        process.exit(1);
    }
};

seedUsers();
