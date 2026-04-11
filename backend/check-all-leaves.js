import mongoose from "mongoose";
import dotenv from "dotenv";
import LeaveRequest from "./src/models/LeaveRequest.js";
import Faculty from "./src/models/Faculty.js";

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("🔍 ALL LEAVE REQUESTS IN DATABASE:\n");
        const leaves = await LeaveRequest.find();
        
        if (leaves.length === 0) {
            console.log("❌ No leave requests found");
        } else {
            for (const leave of leaves) {
                const faculty = await Faculty.findById(leave.faculty);
                console.log(`Faculty: ${faculty?.name} (${faculty?.email})`);
                console.log(`Date: ${leave.date.toDateString()}`);
                console.log(`Status: ${leave.status}`);
                console.log(`conflictResolution exists: ${!!leave.conflictResolution}`);
                if (leave.conflictResolution) {
                    console.log(`  - hasConflicts: ${leave.conflictResolution.hasConflicts}`);
                    console.log(`  - conflicts: ${leave.conflictResolution.conflicts?.length || 0}`);
                    console.log(`  - resolutions: ${leave.conflictResolution.resolutions?.length || 0}`);
                }
                console.log("---");
            }
        }
        
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.connection.close();
    }
};

check();
