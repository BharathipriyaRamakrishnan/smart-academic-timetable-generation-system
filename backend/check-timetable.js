import mongoose from "mongoose";
import dotenv from "dotenv";
import Timetable from "./src/models/Timetable.js";
import Faculty from "./src/models/Faculty.js";
import { getWeekdayFromDate } from "./src/services/leaveConflictResolver.js";

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const sneha = await Faculty.findOne({ name: { $regex: "Sneha", $options: "i" } });
        console.log(`✅ Sneha ID: ${sneha._id}\n`);
        
        const weekday = getWeekdayFromDate(new Date("2026-04-15"));
        console.log(`📅 April 15, 2026 is a ${weekday}\n`);
        
        console.log("🔍 CSE-Y1-S2-A Timetable Status:\n");
        const timetable = await Timetable.findOne({ 
            name: { $regex: "CSE-Y1-S2-A", $options: "i" }
        });
        
        if (!timetable) {
            console.log("❌ Timetable not found");
            
            console.log("\nAvailable timetables:");
            const all = await Timetable.find().select("name status department");
            all.forEach(t => console.log(`  - ${t.name} (${t.status})`));
        } else {
            console.log(`✅ Found: ${timetable.name}`);
            console.log(`   Status: ${timetable.status}`);
            console.log(`   Department: ${timetable.department}`);
            console.log(`   Days: ${timetable.schedule.map(s => s.day).join(", ")}\n`);
            
            // Check Wednesday schedule
            console.log(`🔍 Checking ${weekday} schedule:\n`);
            const schedule = timetable.schedule.find(s => s.day === weekday);
            
            if (!schedule) {
                console.log(`❌ No schedule for ${weekday}`);
            } else {
                console.log(`✅ Found schedule for ${weekday}:`);
                
                // Populate faculty for this schedule
                const populatedTimetable = await Timetable.findById(timetable._id)
                    .populate("schedule.slots.faculty", "name _id");
                const popSchedule = populatedTimetable.schedule.find(s => s.day === weekday);
                
                const snehaSlots = popSchedule.slots.filter(slot => 
                    slot.faculty && slot.faculty._id.toString() === sneha._id.toString()
                );
                
                if (snehaSlots.length === 0) {
                    console.log(`   ❌ Sneha has NO classes on ${weekday}`);
                    console.log(`\n   All slots on ${weekday}:`);
                    popSchedule.slots.forEach((s, i) => {
                        const facultyName = s.faculty?.name || "No faculty";
                        console.log(`   ${i+1}. ${s.time} - ${s.type} (${facultyName})`);
                    });
                } else {
                    console.log(`   ✅ Sneha has ${snehaSlots.length} class(es) on ${weekday}:`);
                    snehaSlots.forEach(s => {
                        console.log(`      - ${s.time}: ${s.type}`);
                    });
                }
            }
        }
        
        // Summary
        console.log("\n" + "=".repeat(60));
        console.log("📋 SUMMARY & RECOMMENDATIONS\n");
        
        if (!timetable) {
            console.log("❌ Timetable CSE-Y1-S2-A not found in database!");
        } else if (timetable.status !== "PUBLISHED") {
            console.log(`❌ Timetable status is "${timetable.status}", not "PUBLISHED"`);
            console.log("\n📝 ACTION: Change timetable status to PUBLISHED");
            console.log("   1. Go to Timetables");
            console.log("   2. Select CSE-Y1-S2-A");
            console.log("   3. Click 'Publish' button");
            console.log("   4. Re-approve Sneha's leave");
            console.log("   5. Suggestions should now appear!");
        } else {
            const schedule = timetable.schedule.find(s => s.day === weekday);
            if (!schedule || schedule.slots.filter(s => s.faculty && s.faculty.toString() === sneha._id.toString()).length === 0) {
                console.log(`❌ Sneha has no classes on ${weekday} in this timetable`);
            } else {
                console.log(`✅ Everything looks good!`);
                console.log(`   Timetable is PUBLISHED and Sneha has classes on ${weekday}`);
                console.log(`   Leave conflict resolution should work.`);
            }
        }
        
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.connection.close();
    }
};

check();
