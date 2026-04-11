import mongoose from "mongoose";
import dotenv from "dotenv";
import Timetable from "./src/models/Timetable.js";
import LeaveRequest from "./src/models/LeaveRequest.js";
import Faculty from "./src/models/Faculty.js";
import { getWeekdayFromDate } from "./src/services/leaveConflictResolver.js";

dotenv.config();

const fullDiagnose = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔍 FULL DIAGNOSTIC\n");
        
        // 1. Check timetable status
        console.log("1️⃣  TIMETABLE STATUS:");
        const timetable = await Timetable.findOne({ 
            name: { $regex: "CSE-Y1-S2-A", $options: "i" }
        });
        
        if (timetable) {
            console.log(`   Name: ${timetable.name}`);
            console.log(`   Status: ${timetable.status} ${timetable.status === "PUBLISHED" ? "✅" : "❌"}`);
            console.log(`   Department: ${timetable.department}`);
        } else {
            console.log("   ❌ Timetable not found");
        }
        
        // 2. Check leave request
        console.log("\n2️⃣  LEAVE REQUEST:");
        const sneha = await Faculty.findOne({ name: { $regex: "Sneha", $options: "i" } });
        const leaveDate = new Date("2026-04-15");
        leaveDate.setHours(0, 0, 0, 0);
        
        const leave = await LeaveRequest.findOne({
            faculty: sneha._id,
            date: leaveDate
        });
        
        if (leave) {
            console.log(`   Faculty: ${sneha.name}`);
            console.log(`   Date: ${leave.date.toDateString()}`);
            console.log(`   Status: ${leave.status} ${leave.status === "APPROVED" ? "✅" : "❌"}`);
            console.log(`   Reason: ${leave.reason}`);
        } else {
            console.log("   ❌ Leave request not found");
        }
        
        const weekday = getWeekdayFromDate(leaveDate);
        console.log(`   Weekday: ${weekday}`);
        
        // 3. Check conflict resolution in leave
        console.log("\n3️⃣  CONFLICT RESOLUTION DATA:");
        if (leave?.conflictResolution) {
            console.log(`   hasConflicts: ${leave.conflictResolution.hasConflicts} ${leave.conflictResolution.hasConflicts ? "✅" : "❌"}`);
            console.log(`   conflictCount: ${leave.conflictResolution.conflictCount}`);
            console.log(`   conflicts found: ${leave.conflictResolution.conflicts?.length || 0}`);
            console.log(`   suggestions: ${leave.conflictResolution.resolutions?.length || 0}`);
            
            if (leave.conflictResolution.error) {
                console.log(`   ⚠️  Error: ${leave.conflictResolution.error}`);
            }
        } else {
            console.log("   ❌ No conflictResolution field!");
        }
        
        // 4. Manual check - are there published timetables?
        console.log("\n4️⃣  PUBLISHED TIMETABLES CHECK:");
        const published = await Timetable.find({ status: "PUBLISHED" });
        console.log(`   Published timetables: ${published.length}`);
        if (published.length > 0) {
            published.forEach(p => console.log(`   - ${p.name}`));
        }
        
        // 5. Check all timetable statuses
        console.log("\n5️⃣  ALL TIMETABLE STATUSES:");
        const allTimetables = await Timetable.find().select("name status");
        const statusCount = {};
        allTimetables.forEach(t => {
            statusCount[t.status] = (statusCount[t.status] || 0) + 1;
        });
        Object.entries(statusCount).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });
        
        // 6. Verify Sneha's assignment
        console.log(`\n6️⃣  SNEHA'S CLASSES ON ${weekday}:`);
        if (timetable) {
            const populated = await Timetable.findById(timetable._id)
                .populate("schedule.slots.faculty", "name _id");
            const schedule = populated.schedule.find(s => s.day === weekday);
            
            if (schedule) {
                const snehaClasses = schedule.slots.filter(s => 
                    s.faculty && s.faculty._id.toString() === sneha._id.toString()
                );
                
                if (snehaClasses.length > 0) {
                    console.log(`   ✅ ${snehaClasses.length} class(es):`);
                    snehaClasses.forEach(c => {
                        console.log(`      - ${c.time}: ${c.type}`);
                    });
                } else {
                    console.log(`   ❌ No classes for Sneha`);
                }
            }
        }
        
        // 7. Recommendations
        console.log("\n" + "=".repeat(70));
        console.log("📋 DIAGNOSIS & RECOMMENDATIONS\n");
        
        let issues = [];
        
        if (!timetable) {
            issues.push("Timetable not found");
        } else if (timetable.status !== "PUBLISHED") {
            issues.push(`Timetable status is "${timetable.status}", not "PUBLISHED"`);
        }
        
        if (!leave) {
            issues.push("Leave request not found");
        } else if (leave.status !== "APPROVED") {
            issues.push(`Leave status is "${leave.status}", not "APPROVED"`);
        }
        
        if (!leave?.conflictResolution?.hasConflicts && leave?.status === "APPROVED") {
            issues.push("Leave was approved but conflictResolution shows no conflicts");
        }
        
        if (issues.length === 0) {
            console.log("✅ All conditions look good!");
            if (leave.conflictResolution?.hasConflicts) {
                console.log(`\n✅ Suggestions ARE generated (${leave.conflictResolution.conflictCount} conflicts)`);
            } else {
                console.log("\n⚠️  No conflicts were found (Sneha may have no classes on that day)");
            }
        } else {
            console.log("❌ ISSUES FOUND:\n");
            issues.forEach((issue, i) => {
                console.log(`   ${i+1}. ${issue}`);
            });
            
            console.log("\n📝 ACTIONS TO FIX:\n");
            if (issues.some(i => i.includes("PUBLISHED"))) {
                console.log("   A) Publish the timetable:");
                console.log("      1. Go to Timetables → CSE-Y1-S2-A");
                console.log("      2. Admin must click 'Accept' to PUBLISH");
                console.log("      3. Status should change from PENDING_APPROVAL → PUBLISHED\n");
            }
            
            if (issues.some(i => i.includes("Leave status"))) {
                console.log("   B) Approve the leave:");
                console.log("      1. Go to Leave Requests");
                console.log("      2. Coordinator clicks 'Approve'");
                console.log("      3. Status should change to APPROVED\n");
            }
            
            if (issues.some(i => i.includes("no conflicts"))) {
                console.log("   C) Re-approve the leave to trigger conflict detection:");
                console.log("      1. After timetable is PUBLISHED");
                console.log("      2. Re-approve the leave request");
                console.log("      3. System will now detect conflicts\n");
            }
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message, error.stack);
    } finally {
        await mongoose.connection.close();
    }
};

fullDiagnose();
