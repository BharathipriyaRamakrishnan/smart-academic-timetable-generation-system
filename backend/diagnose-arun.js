import mongoose from "mongoose";
import dotenv from "dotenv";
import LeaveRequest from "./src/models/LeaveRequest.js";
import Timetable from "./src/models/Timetable.js";
import Faculty from "./src/models/Faculty.js";
import { getWeekdayFromDate } from "./src/services/leaveConflictResolver.js";

dotenv.config();

const diagnoseArun = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔍 ARUN KUMAR LEAVE DIAGNOSTIC\n");
        
        // 1. Find Arun Kumar
        console.log("1️⃣  FINDING ARUN KUMAR:\n");
        const arun = await Faculty.findOne({ name: { $regex: "Arun", $options: "i" } });
        
        if (!arun) {
            console.log("❌ Arun Kumar not found");
            return;
        }
        
        console.log(`✅ Found: ${arun.name}`);
        console.log(`   ID: ${arun._id}`);
        console.log(`   Department: ${arun.department}\n`);
        
        // 2. Find the leave request
        console.log("2️⃣  LEAVE REQUEST:\n");
        const leaveDate = new Date("2026-04-14");
        leaveDate.setHours(0, 0, 0, 0);
        
        const leave = await LeaveRequest.findOne({
            faculty: arun._id,
            date: leaveDate
        });
        
        if (!leave) {
            console.log("❌ Leave request not found for Apr 14");
            console.log("\n   Checking all leaves for Arun:");
            const allLeaves = await LeaveRequest.find({ faculty: arun._id });
            console.log(`   Found ${allLeaves.length} leaves`);
            allLeaves.forEach(l => {
                console.log(`   - ${l.date.toDateString()}: ${l.status}`);
            });
            return;
        }
        
        console.log(`✅ Leave found:`);
        console.log(`   Date: ${leave.date.toDateString()}`);
        console.log(`   Status: ${leave.status}`);
        console.log(`   Reason: ${leave.reason}\n`);
        
        const weekday = getWeekdayFromDate(leave.date);
        console.log(`   Weekday: ${weekday}\n`);
        
        // 3. Check conflict resolution data
        console.log("3️⃣  CONFLICT RESOLUTION DATA:\n");
        console.log(`   hasConflicts: ${leave.conflictResolution?.hasConflicts}`);
        console.log(`   conflictCount: ${leave.conflictResolution?.conflictCount}`);
        console.log(`   conflicts array length: ${leave.conflictResolution?.conflicts?.length}`);
        console.log(`   resolutions array length: ${leave.conflictResolution?.resolutions?.length}\n`);
        
        if (leave.conflictResolution?.error) {
            console.log(`   ⚠️  Error during conflict resolution:\n   ${leave.conflictResolution.error}\n`);
        }
        
        // 4. Check timetable status
        console.log("4️⃣  TIMETABLE STATUS:\n");
        const timetable = await Timetable.findOne({ 
            name: { $regex: "CSE-Y1-S2-A", $options: "i" }
        });
        
        if (!timetable) {
            console.log("❌ Timetable not found");
            return;
        }
        
        console.log(`   Name: ${timetable.name}`);
        console.log(`   Status: ${timetable.status} ${timetable.status === "PUBLISHED" ? "✅" : "❌"}`);
        console.log(`   Department: ${timetable.department}\n`);
        
        // 5. Check Arun's classes on the leave date
        console.log(`5️⃣  ARUN'S CLASSES ON ${weekday}:\n`);
        
        const populated = await Timetable.findById(timetable._id)
            .populate("schedule.slots.faculty", "name _id")
            .populate("schedule.slots.subject", "name");
        
        const scheduleForDay = populated.schedule.find(s => s.day === weekday);
        
        if (!scheduleForDay) {
            console.log(`❌ No schedule found for ${weekday}`);
        } else {
            console.log(`   All classes on ${weekday}:`);
            scheduleForDay.slots.forEach((slot, i) => {
                const facultyName = slot.faculty?.name || "No faculty assigned";
                const facultyId = slot.faculty?._id || "N/A";
                const isArun = slot.faculty && slot.faculty._id.toString() === arun._id.toString();
                const marker = isArun ? " ← ARUN'S CLASS" : "";
                console.log(`   ${i+1}. ${slot.time} | ${slot.type} | ${facultyName} (${facultyId})${marker}`);
            });
            
            console.log(`\n   Arun's classes on ${weekday}:`);
            const arunClasses = scheduleForDay.slots.filter(s => 
                s.faculty && s.faculty._id.toString() === arun._id.toString() &&
                s.type !== "Break" && s.type !== "Lunch" && s.type !== "Free"
            );
            
            if (arunClasses.length === 0) {
                console.log(`   ❌ NO CLASSES ASSIGNED TO ARUN`);
            } else {
                console.log(`   ✅ ${arunClasses.length} class(es):`);
                arunClasses.forEach(c => {
                    console.log(`      - ${c.time}: ${c.type}`);
                });
            }
        }
        
        // 6. Check published timetables
        console.log(`\n6️⃣  PUBLISHED TIMETABLES:\n`);
        const published = await Timetable.find({ status: "PUBLISHED" });
        console.log(`   Total: ${published.length}`);
        if (published.length === 0) {
            console.log(`   ❌ NO PUBLISHED TIMETABLES - This is the problem!`);
        } else {
            published.forEach(p => console.log(`   - ${p.name}`));
        }
        
        // 7. Summary
        console.log("\n" + "=".repeat(70));
        console.log("📋 SUMMARY\n");
        
        if (timetable.status !== "PUBLISHED") {
            console.log(`❌ TIMETABLE NOT PUBLISHED`);
            console.log(`   Current status: ${timetable.status}`);
            console.log(`   The conflict resolver only searches PUBLISHED timetables!\n`);
        }
        
        if (leave.conflictResolution?.conflictCount === 0) {
            const arunOnDay = scheduleForDay?.slots.filter(s => 
                s.faculty && s.faculty._id.toString() === arun._id.toString()
            ).length || 0;
            
            if (arunOnDay === 0) {
                console.log(`❌ NO CONFLICTS because Arun has NO classes on ${weekday}`);
                console.log(`   Leave date applied correctly: ${leave.date.toDateString()}`);
                console.log(`   Weekday detected correctly: ${weekday}`);
                console.log(`   But Arun is NOT assigned to any slots on that day!\n`);
            } else {
                console.log(`❌ NO CONFLICTS - Even though Arun has ${arunOnDay} class(es) on ${weekday}`);
                console.log(`   This might be a bug in the conflict resolver!\n`);
            }
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message, error.stack);
    } finally {
        await mongoose.connection.close();
    }
};

diagnoseArun();
