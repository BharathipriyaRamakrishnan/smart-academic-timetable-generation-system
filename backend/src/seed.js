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
        await User.findOneAndUpdate(
            { email: "admin@example.com" },
            {
                name: "Admin User",
                email: "admin@example.com",
                password: "password123",
                role: "ADMIN"
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log("✓ Admin user seeded successfully!");
        console.log("  Email: admin@example.com");
        console.log("  Password: password123");

        // Seed Coordinator
        await User.findOneAndUpdate(
            { email: "coordinator@example.com" },
            {
                name: "Coordinator User",
                email: "coordinator@example.com",
                password: "password123",
                role: "COORDINATOR",
                coordinatorOf: "CSE"
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log("✓ Coordinator user seeded successfully!");
        console.log("  Email: coordinator@example.com");
        console.log("  Password: password123");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding users:", error);
        process.exit(1);
    }
};

seedUsers();
