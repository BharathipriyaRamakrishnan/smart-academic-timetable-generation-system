import mongoose from "mongoose";
import dotenv from "dotenv";
import LeaveRequest from "./src/models/LeaveRequest.js";
import Faculty from "./src/models/Faculty.js";
import Timetable from "./src/models/Timetable.js";

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("🔍 COMPREHENSIVE STATE CHECK\n");
        
        // 1. All leaves with faculty names
        console.log("1️⃣  ALL LEAVE REQUESTS:\n");
        const leaves = await LeaveRequest.find();
        
        for (const leave of leaves) {
            const faculty = await Faculty.findById(leave.faculty);
            console.log(`Faculty: ${faculty?.name} (ID: ${leave.faculty})`);
            console.log(`Date: ${leave.date.toDateString()}`);
            console.log(`Status: ${leave.status}`);
            console.log(`Has Conflicts: ${leave.conflictResolution?.hasConflicts}`);
            console.log(`Conflict Count: ${leave.conflictResolution?.conflictCount}`);
            console.log("---");
        }
        
        // 2. Sneha info
        console.log("\n2️⃣  SNEHA INFO:\n");
        const sneha = await Faculty.findOne({ name: { $regex: "Sneha", $options: "i" } });
        console.log(`Name: ${sneha.name}`);
        console.log(`ID: ${sneha._id}`);
        console.log(`Department: ${sneha.department}`);
        
        const snehaLeaves = await LeaveRequest.find({ faculty: sneha._id });
        console.log(`Leave requests for Sneha: ${snehaLeaves.length}`);
        if (snehaLeaves.length > 0) {
            snehaLeaves.forEach(l => console.log(`  - ${l.date.toDateString()}`));
        }
        
        // 3. Timetable status
        console.log("\n3️⃣  TIMETABLE STATUS:\n");
        const timetable = await Timetable.findOne({ name: { $regex: "CSE-Y1-S2-A", $options: "i" } });
        console.log(`Name: ${timetable?.name}`);
        console.log(`Status: ${timetable?.status}`);
        console.log(`Is Published: ${timetable?.status === "PUBLISHED" ? "✅ YES" : "❌ NO"}`);
        
        // 4. All published timetables
        console.log("\n4️⃣  PUBLISHED TIMETABLES:\n");
        const published = await Timetable.find({ status: "PUBLISHED" });
        console.log(`Total: ${published.length}`);
        if (published.length > 0) {
            published.forEach(p => console.log(`  - ${p.name}`));
        } else {
            console.log("   ❌ NONE - this is why no suggestions are generated!");
        }
        
        // 5. All timetable statuses
        console.log("\n5️⃣  ALL TIMETABLES BY STATUS:\n");
        const all = await Timetable.find().select("name status");
        const grouped = {};
        all.forEach(t => {
            if (!grouped[t.status]) grouped[t.status] = [];
            grouped[t.status].push(t.name);
        });
        
        Object.entries(grouped).forEach(([status, names]) => {
            console.log(`${status} (${names.length}):`);
            names.forEach(n => console.log(`  - ${n}`));
        });
        
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.connection.close();
    }
};

check();
