// Diagnose the specific leave scenario
import mongoose from "mongoose";
import dotenv from "dotenv";
import LeaveRequest from "./src/models/LeaveRequest.js";
import Timetable from "./src/models/Timetable.js";
import Faculty from "./src/models/Faculty.js";
import { getWeekdayFromDate } from "./src/services/leaveConflictResolver.js";

dotenv.config();

const diagnose = async () => {
    try {
        console.log("🔍 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        // 1. Find Sneha's leave request
        console.log("🔍 Finding Sneha's leave for 15.04.2026...");
        const leaveDate = new Date("2026-04-15");
        leaveDate.setHours(0, 0, 0, 0);
        
        const sneha = await Faculty.findOne({ name: { $regex: "Sneha", $options: "i" } });
        console.log(`✅ Sneha ID: ${sneha._id}\n`);
        
        const leave = await LeaveRequest.findOne({ 
            faculty: sneha._id,
            date: leaveDate
        });

        if (!leave) {
            console.log("❌ Leave request not found for Sneha on 15.04.2026");
            return;
        }

        console.log("✅ Leave request found!");
        console.log(`   Status: ${leave.status}`);
        console.log(`   Applied By: ${sneha.name}`);
        
        const weekday = getWeekdayFromDate(leave.date);
        console.log(`   Date: ${leave.date.toDateString()} (${weekday})`);
        console.log(`   Reason: ${leave.reason}`);
        
        // 2. Check conflict resolution data
        console.log("\n🔍 Checking conflict resolution data...");
        if (!leave.conflictResolution) {
            console.log("❌ No conflictResolution field found!");
        } else {
            console.log(`   hasConflicts: ${leave.conflictResolution.hasConflicts}`);
            console.log(`   conflictCount: ${leave.conflictResolution.conflictCount}`);
            console.log(`   Conflicts: ${leave.conflictResolution.conflicts?.length || 0}`);
            console.log(`   Resolutions: ${leave.conflictResolution.resolutions?.length || 0}`);
            
            if (leave.conflictResolution.conflicts?.length > 0) {
                console.log("\n   📋 Conflicts found:");
                leave.conflictResolution.conflicts.forEach((c, i) => {
                    console.log(`      ${i+1}. Timetable: ${c.timetableName}`);
                    console.log(`         Time: ${c.time} on ${c.day}`);
                    console.log(`         Type: ${c.type}`);
                });
            }
            
            if (leave.conflictResolution.resolutions?.length > 0) {
                console.log("\n   💡 Suggestions:");
                leave.conflictResolution.resolutions.forEach((r, i) => {
                    console.log(`      Resolution ${i+1}:`);
                    console.log(`         Conflict: ${r.conflict?.timetableName} at ${r.conflict?.time}`);
                    if (r.suggestions?.length > 0) {
                        r.suggestions.forEach((s, j) => {
                            console.log(`         Suggestion ${j+1}: ${s.type}`);
                            console.log(`            Description: ${s.description}`);
                            console.log(`            Status: ${s.status}`);
                            console.log(`            Priority: ${s.priority}`);
                        });
                    } else {
                        console.log(`         ❌ No suggestions`);
                    }
                });
            }
            
            if (leave.conflictResolution.error) {
                console.log(`\n   ❌ Error during conflict resolution: ${leave.conflictResolution.error}`);
            }
        }

        // 3. Check CSE-Y1-S2-A timetable
        console.log("\n🔍 Checking CSE-Y1-S2-A timetable...");
        const timetable = await Timetable.findOne({ 
            name: { $regex: "CSE-Y1-S2-A", $options: "i" }
        });

        if (!timetable) {
            console.log("❌ Timetable CSE-Y1-S2-A not found");
            console.log("\n🔍 Available timetables:");
            const allTimetables = await Timetable.find().select("name status");
            allTimetables.forEach(t => {
                console.log(`   - ${t.name} (${t.status})`);
            });
        } else {
            console.log(`✅ Timetable found!`);
            console.log(`   Status: ${timetable.status}`);
            console.log(`   Department: ${timetable.department}`);
            console.log(`   Days in schedule: ${timetable.schedule.map(s => s.day).join(", ")}`);
            
            // Check if Sneha has classes on Wednesday (15.04.2026 is Wednesday)
            const schedule = timetable.schedule.find(s => s.day === weekday);
            if (!schedule) {
                console.log(`\n⚠️  No schedule found for ${weekday}`);
            } else {
                console.log(`\n   Schedule for ${weekday}:`);
                const snehaSlots = schedule.slots.filter(slot => {
                    if (!slot.faculty) return false;
                    return slot.faculty.toString() === sneha._id.toString();
                });
                
                if (snehaSlots.length === 0) {
                    console.log(`   ❌ Sneha has NO classes on ${weekday}`);
                } else {
                    console.log(`   ✅ Sneha has ${snehaSlots.length} classes on ${weekday}:`);
                    snehaSlots.forEach(s => {
                        console.log(`      - ${s.time}: ${s.type}`);
                    });
                }
            }
        }

        // 4. Recommendations
        console.log("\n" + "=".repeat(60));
        console.log("📝 RECOMMENDATIONS");
        console.log("=".repeat(60));
        
        if (!leave.conflictResolution || leave.conflictResolution.conflictCount === 0) {
            console.log(`
❌ WHY NO SUGGESTIONS?

Possible reasons:
1. Timetable CSE-Y1-S2-A is NOT PUBLISHED
   → Change status from DRAFT/APPROVED to PUBLISHED
   
2. Sneha has NO classes on ${weekday}
   → Check if Sneha is actually assigned to this day in the timetable
   
3. Leave date (15.04.2026) might not be correct
   → Verify the leave was applied for Wednesday

📝 ACTION ITEMS:
1. Make sure CSE-Y1-S2-A timetable status is "PUBLISHED"
2. Verify Sneha teaches on "${weekday}" in this timetable
3. Re-approve the leave after publishing the timetable
            `);
        } else {
            console.log(`
✅ CONFLICTS DETECTED: ${leave.conflictResolution.conflictCount} found
${leave.conflictResolution.resolutions.length} resolution suggestions available

📝 VIEW SUGGESTIONS:
- Frontend: Look for the "Conflict Suggestions" section when viewing this leave
- API: GET /api/leaves/${leave._id}/conflicts
            `);
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message, error.stack);
    } finally {
        await mongoose.connection.close();
    }
};

diagnose();
