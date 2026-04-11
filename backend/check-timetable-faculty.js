import mongoose from "mongoose";
import dotenv from "dotenv";
import Timetable from "./src/models/Timetable.js";
import Faculty from "./src/models/Faculty.js";

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("🔍 TIMETABLE CSE-Y1-S2-A FACULTY IDS:\n");
        
        const timetable = await Timetable.findOne({ 
            name: { $regex: "CSE-Y1-S2-A", $options: "i" }
        });
        
        console.log(`Timetable: ${timetable.name}`);
        console.log(`Status: ${timetable.status}\n`);
        
        // Collect all unique faculty IDs from the timetable
        const facultyIds = new Set();
        timetable.schedule.forEach(day => {
            day.slots.forEach(slot => {
                if (slot.faculty) {
                    facultyIds.add(slot.faculty.toString());
                }
            });
        });
        
        console.log(`Unique faculty IDs in timetable: ${facultyIds.size}\n`);
        
        for (const id of facultyIds) {
            const faculty = await Faculty.findById(id);
            if (faculty) {
                console.log(`✅ ${id}`);
                console.log(`   Name: ${faculty.name}`);
                console.log(`   Department: ${faculty.department}\n`);
            } else {
                console.log(`❌ ${id} - NOT FOUND IN FACULTY COLLECTION\n`);
            }
        }
        
        // Check Tuesday schedule
        console.log("\n" + "=".repeat(70));
        console.log("TUESDAY SCHEDULE:\n");
        
        const tuesday = timetable.schedule.find(s => s.day === "Tuesday");
        if (tuesday) {
            console.log("All slots:");
            for (const slot of tuesday.slots) {
                if (slot.faculty) {
                    const faculty = await Faculty.findById(slot.faculty);
                    const name = faculty?.name || "❌ NOT FOUND";
                    console.log(`${slot.time} | ${slot.type} | ${name} (ID: ${slot.faculty})`);
                } else {
                    console.log(`${slot.time} | ${slot.type} | (no faculty)`);
                }
            }
        }
        
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.connection.close();
    }
};

check();
