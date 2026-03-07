import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

async function verifyUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ role: { $in: ["FACULTY", "COORDINATOR"] } });

        console.log("Checking Faculty and Coordinators...");
        let missingDept = 0;

        users.forEach(u => {
            const dept = u.role === "COORDINATOR" ? u.coordinatorOf : u.department;
            if (!dept) {
                console.log(`❌ User ${u.email} (${u.role}) has NO department assigned.`);
                missingDept++;
            } else {
                console.log(`✅ User ${u.email} (${u.role}) -> ${dept}`);
            }
        });

        if (missingDept === 0) {
            console.log("\nAll faculty and coordinators have departments assigned.");
        } else {
            console.log(`\nFound ${missingDept} users missing department assignments.`);
            console.log("Recommendation: Run 'npm run seed:full' or update them manually.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyUsers();
