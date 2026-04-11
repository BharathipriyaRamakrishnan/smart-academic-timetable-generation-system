import mongoose from "mongoose";
import dotenv from "dotenv";
import LeaveRequest from "./src/models/LeaveRequest.js";

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("🔍 RAW LEAVE REQUEST DATA:\n");
        const leaves = await LeaveRequest.find();
        
        leaves.forEach((leave, i) => {
            console.log(`Leave ${i+1}:`);
            console.log(`  Faculty ID: ${leave.faculty}`);
            console.log(`  Date: ${leave.date.toDateString()}`);
            console.log(`  Status: ${leave.status}`);
            console.log(`  conflictResolution.hasConflicts: ${leave.conflictResolution?.hasConflicts}`);
            console.log(`  conflictResolution.conflictCount: ${leave.conflictResolution?.conflictCount}`);
            console.log(`  conflictResolution.conflicts: ${leave.conflictResolution?.conflicts?.length}`);
            console.log(`  conflictResolution.resolutions: ${leave.conflictResolution?.resolutions?.length}`);
            console.log();
        });
        
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.connection.close();
    }
};

check();
