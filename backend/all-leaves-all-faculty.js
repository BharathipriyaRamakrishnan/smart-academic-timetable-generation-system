import mongoose from "mongoose";
import dotenv from "dotenv";
import LeaveRequest from "./src/models/LeaveRequest.js";
import Faculty from "./src/models/Faculty.js";

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("🔍 ALL LEAVE REQUESTS WITH DETAILS:\n");
        const leaves = await LeaveRequest.find();
        
        if (leaves.length === 0) {
            console.log("❌ No leaves found");
        } else {
            for (const leave of leaves) {
                const faculty = await Faculty.findById(leave.faculty);
                console.log(`Leave ID: ${leave._id}`);
                console.log(`Faculty ID: ${leave.faculty}`);
                console.log(`Faculty Name: ${faculty?.name || "❌ NOT FOUND"}`);
                console.log(`Date: ${leave.date.toDateString()}`);
                console.log(`Status: ${leave.status}`);
                console.log(`Reason: ${leave.reason}`);
                console.log(`Has Conflicts: ${leave.conflictResolution?.hasConflicts}`);
                console.log(`Conflict Count: ${leave.conflictResolution?.conflictCount}`);
                console.log("---\n");
            }
        }
        
        console.log("\n🔍 ALL FACULTY IN SYSTEM:\n");
        const allFaculty = await Faculty.find().select("name _id department");
        allFaculty.forEach((f, i) => {
            console.log(`${i+1}. ${f.name} (ID: ${f._id}) - ${f.department}`);
        });
        
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.connection.close();
    }
};

check();
