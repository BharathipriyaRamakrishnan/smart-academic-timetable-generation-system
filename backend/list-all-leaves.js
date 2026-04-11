// Find all leaves for Sneha
import mongoose from "mongoose";
import dotenv from "dotenv";
import LeaveRequest from "./src/models/LeaveRequest.js";
import Faculty from "./src/models/Faculty.js";

dotenv.config();

const diagnose = async () => {
    try {
        console.log("🔍 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected\n");

        const sneha = await Faculty.findOne({ name: { $regex: "Sneha", $options: "i" } });
        
        console.log("🔍 All leave requests for Sneha...");
        const leaves = await LeaveRequest.find({ faculty: sneha._id });
        
        if (leaves.length === 0) {
            console.log("❌ No leaves found for Sneha");
        } else {
            console.log(`✅ Found ${leaves.length} leave(s):\n`);
            leaves.forEach((leave, i) => {
                console.log(`${i+1}. Date: ${leave.date.toDateString()}`);
                console.log(`   Status: ${leave.status}`);
                console.log(`   Reason: ${leave.reason}`);
                console.log(`   Has conflictResolution: ${!!leave.conflictResolution}`);
                if (leave.conflictResolution) {
                    console.log(`   - hasConflicts: ${leave.conflictResolution.hasConflicts}`);
                    console.log(`   - conflictCount: ${leave.conflictResolution.conflictCount}`);
                    console.log(`   - suggestions: ${leave.conflictResolution.resolutions?.length || 0}`);
                }
                console.log();
            });
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.connection.close();
    }
};

diagnose();
