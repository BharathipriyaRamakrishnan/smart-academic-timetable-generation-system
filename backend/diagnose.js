// Test script to diagnose leave conflict resolution
import mongoose from "mongoose";
import dotenv from "dotenv";

import LeaveRequest from "./src/models/LeaveRequest.js";
import Faculty from "./src/models/Faculty.js";
import Timetable from "./src/models/Timetable.js";
import User from "./src/models/User.js"; // Import User to register schema
import { getWeekdayFromDate } from "./src/services/leaveConflictResolver.js";

dotenv.config();

const diagnose = async () => {
    try {
        console.log("🔍 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Check if Sneha Gupta exists
        console.log("\n🔍 Searching for Sneha Gupta...");
        const sneha = await Faculty.findOne({ name: { $regex: "Sneha", $options: "i" } });
        
        if (!sneha) {
            console.log("❌ Sneha Gupta not found in Faculty collection");
            const allFaculty = await Faculty.find().select("name email");
            console.log("Available faculty:", allFaculty.map(f => f.name));
        } else {
            console.log(`✅ Found: ${sneha.name} (ID: ${sneha._id})`);
            console.log(`   Department: ${sneha.department}, Email: ${sneha.email}`);
        }

        // 2. Check if there are published timetables
        console.log("\n🔍 Checking for published timetables...");
        const timetables = await Timetable.find({ status: "PUBLISHED" }).select("name status department schedule");
        console.log(`Found ${timetables.length} PUBLISHED timetables`);
        
        if (timetables.length > 0) {
            timetables.forEach(t => {
                console.log(`   ✅ ${t.name} (${t.department}): days = ${t.schedule.map(s => s.day).join(", ")}`);
            });
        } else {
            console.log(`   ⚠️  No PUBLISHED timetables found!`);
            
            // Check all timetables by status
            console.log("\n🔍 Checking all timetables by status...");
            const allStatuses = await Timetable.find().select("name status department");
            const statusCount = {};
            allStatuses.forEach(t => {
                statusCount[t.status] = (statusCount[t.status] || 0) + 1;
            });
            
            console.log("   Timetables by status:");
            Object.entries(statusCount).forEach(([status, count]) => {
                console.log(`   - ${status}: ${count}`);
            });
            
            if (allStatuses.length > 0) {
                console.log("\n   Sample timetables:");
                allStatuses.slice(0, 5).forEach(t => {
                    console.log(`   - ${t.name} (${t.status})`);
                });
            }
        }

        // 3. Check the leave request
        console.log("\n🔍 Searching for leave on 2026-04-17...");
        const leaveDate = new Date("2026-04-17");
        leaveDate.setHours(0, 0, 0, 0);
        
        const leaves = await LeaveRequest.find({ date: leaveDate });
        
        console.log(`✅ Found ${leaves.length} leave requests on this date`);
        
        if (leaves.length > 0) {
            for (const leave of leaves) {
                const faculty = await Faculty.findById(leave.faculty);
                console.log(`\n   Faculty: ${faculty?.name} (${faculty?.email})`);
                console.log(`   Status: ${leave.status}`);
                console.log(`   Leave Date: ${leave.date}`);
                console.log(`   Reason: ${leave.reason}`);
                if (leave.conflictResolution) {
                    console.log(`   Conflict Resolution: hasConflicts=${leave.conflictResolution.hasConflicts}`);
                    console.log(`   Conflicts: ${leave.conflictResolution.conflicts?.length || 0}`);
                    console.log(`   Resolutions: ${leave.conflictResolution.resolutions?.length || 0}`);
                    if (leave.conflictResolution.error) {
                        console.log(`   Error: ${leave.conflictResolution.error}`);
                    }
                } else {
                    console.log(`   ⚠️  No conflictResolution field`);
                }
            }
        } else {
            console.log("   ❌ No leaves found for this date");
        }

        // 4. Check date to weekday conversion
        console.log("\n🔍 Checking date conversion...");
        const weekday = getWeekdayFromDate(new Date("2026-04-17"));
        console.log(`✅ 2026-04-17 converts to: ${weekday}`);

        // 5. If Sneha exists, check her assigned classes
        if (sneha) {
            console.log(`\n🔍 Checking ${sneha.name}'s assigned classes on ${weekday}...`);
            const populatedTimetables = await Timetable.find({ status: "PUBLISHED" })
                .populate("schedule.slots.faculty", "_id name")
                .populate("schedule.slots.subject", "name");
            
            let hasClasses = false;
            populatedTimetables.forEach(tt => {
                const schedule = tt.schedule.find(s => s.day === weekday);
                if (!schedule) return;
                
                const classes = schedule.slots.filter(slot => {
                    if (!slot.faculty) return false;
                    return slot.faculty._id.toString() === sneha._id.toString();
                });
                
                if (classes.length > 0) {
                    hasClasses = true;
                    console.log(`   📍 ${tt.name} on ${weekday}:`);
                    classes.forEach(c => {
                        console.log(`      - ${c.time}: ${c.subject?.name || "Unknown"} (${c.type})`);
                    });
                }
            });
            
            if (!hasClasses) {
                console.log(`   ⚠️  ${sneha.name} has no classes on ${weekday}`);
            }
        }

        console.log("\n✅ Diagnosis complete!");
        
    } catch (error) {
        console.error("❌ Error:", error.message, error.stack);
    } finally {
        await mongoose.connection.close();
    }
};

diagnose();
