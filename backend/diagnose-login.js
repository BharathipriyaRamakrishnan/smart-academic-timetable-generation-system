// Diagnose login issue
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

const diagnoseDiagnose = async () => {
    try {
        console.log("🔍 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        // 1. Check if user exists
        console.log("🔍 Searching for priya.sharma@college.edu...");
        const user = await User.findOne({ email: "priya.sharma@college.edu" });
        
        if (!user) {
            console.log("❌ User NOT found with email: priya.sharma@college.edu");
            
            // List all users
            console.log("\n🔍 All users in database:");
            const allUsers = await User.find().select("_id name email role department status");
            if (allUsers.length === 0) {
                console.log("   ❌ No users in database!");
            } else {
                allUsers.forEach((u, i) => {
                    console.log(`   ${i+1}. ${u.name} (${u.email}) - Role: ${u.role}, Status: ${u.status}`);
                });
            }
        } else {
            console.log(`✅ User found: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Department: ${user.department}`);
            console.log(`   Status: ${user.status}`);
            console.log(`   Password Hash: ${user.password ? "✅ Set" : "❌ Missing"}`);
            console.log(`   Created: ${user.createdAt}`);
            
            if (user.status === "INACTIVE") {
                console.log(`\n⚠️  WARNING: Account is INACTIVE - User cannot log in!`);
            }
        }

        console.log("\n✅ Diagnosis complete!");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.connection.close();
    }
};

diagnoseDiagnose();
