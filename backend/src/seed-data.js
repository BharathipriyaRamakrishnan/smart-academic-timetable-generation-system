import mongoose from "mongoose";
import dotenv from "dotenv";
import Subject from "./models/Subject.js";
import Faculty from "./models/Faculty.js";
import Batch from "./models/Batch.js";
import Classroom from "./models/Classroom.js";
import User from "./models/User.js";

dotenv.config();

const DEPARTMENTS = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"];

// ── Sample Subjects ───────────────────────────────────────────────────────────
const sampleSubjects = [
    // Computer Science
    { name: "Data Structures", codes: ["CS201"], credits: 4, type: "Core", departments: ["Computer Science"], semester: 3, lecturesPerWeek: 4 },
    { name: "Operating Systems", codes: ["CS301"], credits: 4, type: "Core", departments: ["Computer Science"], semester: 5, lecturesPerWeek: 4 },
    { name: "Database Management Systems", codes: ["CS302"], credits: 4, type: "Core", departments: ["Computer Science"], semester: 5, lecturesPerWeek: 3 },
    { name: "Computer Networks", codes: ["CS401"], credits: 4, type: "Core", departments: ["Computer Science"], semester: 7, lecturesPerWeek: 4 },
    { name: "Machine Learning", codes: ["CS501"], credits: 3, type: "Elective", departments: ["Computer Science"], semester: 7, lecturesPerWeek: 3 },
    { name: "Web Development Lab", codes: ["CS-LAB-301"], credits: 2, type: "Lab", departments: ["Computer Science"], semester: 5, lecturesPerWeek: 3, labsPerWeek: 1 },

    // Information Technology
    { name: "Software Engineering", codes: ["IT301"], credits: 4, type: "Core", departments: ["Information Technology"], semester: 5, lecturesPerWeek: 4 },
    { name: "Cloud Computing", codes: ["IT401"], credits: 3, type: "Elective", departments: ["Information Technology"], semester: 7, lecturesPerWeek: 3 },
    { name: "Cyber Security", codes: ["IT402"], credits: 3, type: "Elective", departments: ["Information Technology"], semester: 7, lecturesPerWeek: 3 },

    // Electronics
    { name: "Digital Electronics", codes: ["EC201"], credits: 4, type: "Core", departments: ["Electronics"], semester: 3, lecturesPerWeek: 4 },
    { name: "Signals and Systems", codes: ["EC301"], credits: 4, type: "Core", departments: ["Electronics"], semester: 5, lecturesPerWeek: 4 },
    { name: "VLSI Design", codes: ["EC401"], credits: 3, type: "Elective", departments: ["Electronics"], semester: 7, lecturesPerWeek: 3 },

    // Mechanical
    { name: "Thermodynamics", codes: ["ME201"], credits: 4, type: "Core", departments: ["Mechanical"], semester: 3, lecturesPerWeek: 4 },
    { name: "Fluid Mechanics", codes: ["ME301"], credits: 4, type: "Core", departments: ["Mechanical"], semester: 5, lecturesPerWeek: 4 },
    { name: "CAD/CAM", codes: ["ME401"], credits: 3, type: "Elective", departments: ["Mechanical"], semester: 7, lecturesPerWeek: 3 },

    // Civil
    { name: "Structural Analysis", codes: ["CE201"], credits: 4, type: "Core", departments: ["Civil"], semester: 3, lecturesPerWeek: 4 },
    { name: "Concrete Technology", codes: ["CE301"], credits: 4, type: "Core", departments: ["Civil"], semester: 5, lecturesPerWeek: 4 },
    { name: "Environmental Engineering", codes: ["CE401"], credits: 3, type: "Elective", departments: ["Civil"], semester: 7, lecturesPerWeek: 3 },

    // Common subjects across CS & IT
    { name: "Engineering Mathematics", codes: ["MA101", "MA102"], credits: 4, type: "Core", departments: ["Computer Science", "Information Technology"], semester: 1, lecturesPerWeek: 4 },
    { name: "Python Programming", codes: ["CS101", "IT101"], credits: 3, type: "Core", departments: ["Computer Science", "Information Technology"], semester: 1, lecturesPerWeek: 3 },
];

// ── Sample Classrooms ─────────────────────────────────────────────────────────
const sampleClassrooms = [
    { name: "LH-101", capacity: 60, type: "Lecture Hall", resources: ["Projector", "Whiteboard"] },
    { name: "LH-102", capacity: 60, type: "Lecture Hall", resources: ["Projector", "Whiteboard"] },
    { name: "LH-201", capacity: 80, type: "Lecture Hall", resources: ["Projector", "Smart Board"] },
    { name: "LH-202", capacity: 80, type: "Lecture Hall", resources: ["Projector"] },
    { name: "LH-301", capacity: 120, type: "Lecture Hall", resources: ["Projector", "Smart Board", "Microphone"] },
    { name: "CS-LAB-A", capacity: 40, type: "Laboratory", resources: ["Computers", "Projector"] },
    { name: "CS-LAB-B", capacity: 40, type: "Laboratory", resources: ["Computers", "Projector"] },
    { name: "IT-LAB-A", capacity: 35, type: "Laboratory", resources: ["Computers", "Projector"] },
    { name: "EC-LAB", capacity: 30, type: "Laboratory", resources: ["Oscilloscope", "Signal Generator", "Projector"] },
    { name: "ME-LAB", capacity: 30, type: "Laboratory", resources: ["CNC Machine", "3D Printer"] },
];

// ── Sample Faculty ─────────────────────────────────────────────────────────────
const sampleFaculty = [
    // Computer Science
    { name: "Dr. Arun Kumar", email: "arun.kumar@college.edu", department: "Computer Science", designation: "Professor", maxLoad: 14 },
    { name: "Dr. Priya Sharma", email: "priya.sharma@college.edu", department: "Computer Science", designation: "Associate Professor", maxLoad: 12 },
    { name: "Mr. Ravi Patel", email: "ravi.patel@college.edu", department: "Computer Science", designation: "Assistant Professor", maxLoad: 12 },
    { name: "Ms. Sneha Gupta", email: "sneha.gupta@college.edu", department: "Computer Science", designation: "Assistant Professor", maxLoad: 10 },

    // Information Technology
    { name: "Dr. Vinod Nair", email: "vinod.nair@college.edu", department: "Information Technology", designation: "Professor", maxLoad: 14 },
    { name: "Ms. Kavya Reddy", email: "kavya.reddy@college.edu", department: "Information Technology", designation: "Associate Professor", maxLoad: 12 },
    { name: "Mr. Suresh Menon", email: "suresh.menon@college.edu", department: "Information Technology", designation: "Assistant Professor", maxLoad: 12 },

    // Electronics
    { name: "Dr. Balaji Rao", email: "balaji.rao@college.edu", department: "Electronics", designation: "Professor", maxLoad: 14 },
    { name: "Ms. Geetha Iyer", email: "geetha.iyer@college.edu", department: "Electronics", designation: "Associate Professor", maxLoad: 12 },

    // Mechanical
    { name: "Dr. Harish Verma", email: "harish.verma@college.edu", department: "Mechanical", designation: "Professor", maxLoad: 14 },
    { name: "Mr. Deepak Singh", email: "deepak.singh@college.edu", department: "Mechanical", designation: "Assistant Professor", maxLoad: 12 },

    // Civil
    { name: "Dr. Anitha Joshi", email: "anitha.joshi@college.edu", department: "Civil", designation: "Professor", maxLoad: 14 },
    { name: "Mr. Mukesh Tiwari", email: "mukesh.tiwari@college.edu", department: "Civil", designation: "Assistant Professor", maxLoad: 12 },
];

// ── Sample Batches ─────────────────────────────────────────────────────────────
const sampleBatches = [
    // Computer Science
    { name: "CS-2023-Sem1-A", department: "Computer Science", semester: 1, section: "A", studentsCount: 60 },
    { name: "CS-2023-Sem1-B", department: "Computer Science", semester: 1, section: "B", studentsCount: 58 },
    { name: "CS-2022-Sem3-A", department: "Computer Science", semester: 3, section: "A", studentsCount: 55 },
    { name: "CS-2021-Sem5-A", department: "Computer Science", semester: 5, section: "A", studentsCount: 50 },
    { name: "CS-2020-Sem7-A", department: "Computer Science", semester: 7, section: "A", studentsCount: 45 },

    // Information Technology
    { name: "IT-2023-Sem1-A", department: "Information Technology", semester: 1, section: "A", studentsCount: 60 },
    { name: "IT-2022-Sem3-A", department: "Information Technology", semester: 3, section: "A", studentsCount: 55 },
    { name: "IT-2021-Sem5-A", department: "Information Technology", semester: 5, section: "A", studentsCount: 50 },

    // Electronics
    { name: "EC-2023-Sem1-A", department: "Electronics", semester: 1, section: "A", studentsCount: 60 },
    { name: "EC-2022-Sem3-A", department: "Electronics", semester: 3, section: "A", studentsCount: 55 },

    // Mechanical
    { name: "ME-2023-Sem1-A", department: "Mechanical", semester: 1, section: "A", studentsCount: 60 },
    { name: "ME-2022-Sem3-A", department: "Mechanical", semester: 3, section: "A", studentsCount: 55 },

    // Civil
    { name: "CE-2023-Sem1-A", department: "Civil", semester: 1, section: "A", studentsCount: 60 },
    { name: "CE-2022-Sem3-A", department: "Civil", semester: 3, section: "A", studentsCount: 55 },
];

// ── Main Seed Function ─────────────────────────────────────────────────────────
const seed = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.\n");

        // ── Subjects ──
        console.log("Seeding subjects...");
        for (const subjectData of sampleSubjects) {
            await Subject.findOneAndUpdate(
                { codes: { $in: subjectData.codes } },
                { $set: subjectData },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`  ✓ ${subjectData.name}`);
        }
        console.log(`Subjects seeded.\n`);

        // ── Classrooms ──
        console.log("Seeding classrooms...");
        for (const roomData of sampleClassrooms) {
            await Classroom.findOneAndUpdate(
                { name: roomData.name },
                { $set: roomData },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`  ✓ ${roomData.name}`);
        }
        console.log(`Classrooms seeded.\n`);

        // ── Faculty ──
        console.log("Seeding faculty and creating user accounts...");
        for (const fData of sampleFaculty) {
            await Faculty.findOneAndUpdate(
                { email: fData.email },
                { $set: fData },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // Auto-create User account for faculty login
            const existingUser = await User.findOne({ email: fData.email });
            if (!existingUser) {
                const user = new User({
                    name: fData.name,
                    email: fData.email,
                    password: "password123", // Default password
                    role: "FACULTY",
                    department: fData.department // Store faculty department for filtering
                });
                await user.save();
                console.log(`  ✓ Created user account: ${fData.email}`);
            } else if (!existingUser.department) {
                await User.findOneAndUpdate({ email: fData.email }, { department: fData.department });
                console.log(`  ✓ Updated department for: ${fData.email}`);
            }
            console.log(`  ✓ Faculty record: ${fData.name}`);
        }
        console.log(`Faculty and users seeded.\n`);

        // ── Batches ──
        console.log("Seeding batches...");
        for (const bData of sampleBatches) {
            await Batch.findOneAndUpdate(
                { name: bData.name },
                { $set: bData },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`  ✓ ${bData.name}`);
        }
        console.log(`Batches seeded.\n`);

        console.log("✅ Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
};

seed();
