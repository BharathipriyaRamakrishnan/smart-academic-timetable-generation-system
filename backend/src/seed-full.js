import mongoose from "mongoose";
import dotenv from "dotenv";
import Subject from "./models/Subject.js";
import Faculty from "./models/Faculty.js";
import Batch from "./models/Batch.js";
import Classroom from "./models/Classroom.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

// Load .env from the parent directory if running from src/
// but usually run from /backend/ root.
dotenv.config();

// ── DATA DEFINITIONS ──────────────────────────────────────────────────────────

const DEPARTMENTS = ["CSE", "IT", "ECE", "MECH"];

const subjectsData = [
    // CSE
    { name: "Engineering Mathematics I", codes: ["CSE-MA101"], credits: 4, type: "Core", departments: ["CSE"], semester: 1, lecturesPerWeek: 4 },
    { name: "Programming in C", codes: ["CSE-CS101"], credits: 3, type: "Core", departments: ["CSE"], semester: 1, lecturesPerWeek: 3 },
    { name: "Engineering Physics", codes: ["CSE-PH101"], credits: 3, type: "Core", departments: ["CSE"], semester: 1, lecturesPerWeek: 3 },
    { name: "English Communication", codes: ["CSE-EN101"], credits: 2, type: "Core", departments: ["CSE"], semester: 1, lecturesPerWeek: 2 },
    { name: "C Programming Lab", codes: ["CSE-CS101L"], credits: 2, type: "Lab", departments: ["CSE"], semester: 1, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Physics Lab", codes: ["CSE-PH101L"], credits: 1, type: "Lab", departments: ["CSE"], semester: 1, lecturesPerWeek: 1, labsPerWeek: 1 },
    { name: "Engineering Mathematics II", codes: ["CSE-MA102"], credits: 4, type: "Core", departments: ["CSE"], semester: 2, lecturesPerWeek: 4 },
    { name: "Object Oriented Programming", codes: ["CSE-CS102"], credits: 3, type: "Core", departments: ["CSE"], semester: 2, lecturesPerWeek: 3 },
    { name: "Digital Logic Design", codes: ["CSE-CS103"], credits: 3, type: "Core", departments: ["CSE"], semester: 2, lecturesPerWeek: 3 },
    { name: "Environmental Science", codes: ["CSE-ES101"], credits: 2, type: "Core", departments: ["CSE"], semester: 2, lecturesPerWeek: 2 },
    { name: "OOP Lab", codes: ["CSE-CS102L"], credits: 2, type: "Lab", departments: ["CSE"], semester: 2, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Data Structures", codes: ["CSE-CS201"], credits: 4, type: "Core", departments: ["CSE"], semester: 3, lecturesPerWeek: 4 },
    { name: "Computer Organization", codes: ["CSE-CS202"], credits: 3, type: "Core", departments: ["CSE"], semester: 3, lecturesPerWeek: 3 },
    { name: "Discrete Mathematics", codes: ["CSE-MA201"], credits: 3, type: "Core", departments: ["CSE"], semester: 3, lecturesPerWeek: 3 },
    { name: "Data Structures Lab", codes: ["CSE-CS201L"], credits: 2, type: "Lab", departments: ["CSE"], semester: 3, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Algorithm Analysis", codes: ["CSE-CS203"], credits: 4, type: "Core", departments: ["CSE"], semester: 4, lecturesPerWeek: 4 },
    { name: "Operating Systems", codes: ["CSE-CS204"], credits: 4, type: "Core", departments: ["CSE"], semester: 4, lecturesPerWeek: 4 },
    { name: "Database Management Systems", codes: ["CSE-CS205"], credits: 4, type: "Core", departments: ["CSE"], semester: 4, lecturesPerWeek: 3 },
    { name: "Computer Networks", codes: ["CSE-CS206"], credits: 3, type: "Core", departments: ["CSE"], semester: 4, lecturesPerWeek: 3 },
    { name: "DBMS Lab", codes: ["CSE-CS205L"], credits: 2, type: "Lab", departments: ["CSE"], semester: 4, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Software Engineering", codes: ["CSE-CS301"], credits: 4, type: "Core", departments: ["CSE"], semester: 5, lecturesPerWeek: 4 },
    { name: "Theory of Computation", codes: ["CSE-CS302"], credits: 3, type: "Core", departments: ["CSE"], semester: 5, lecturesPerWeek: 3 },
    { name: "Compiler Design", codes: ["CSE-CS303"], credits: 3, type: "Core", departments: ["CSE"], semester: 5, lecturesPerWeek: 3 },
    { name: "Machine Learning", codes: ["CSE-CS304E"], credits: 3, type: "Elective", departments: ["CSE"], semester: 5, lecturesPerWeek: 3 },
    { name: "Artificial Intelligence", codes: ["CSE-CS305"], credits: 3, type: "Core", departments: ["CSE"], semester: 6, lecturesPerWeek: 3 },
    { name: "Web Technologies", codes: ["CSE-CS306"], credits: 3, type: "Core", departments: ["CSE"], semester: 6, lecturesPerWeek: 3 },
    { name: "Deep Learning", codes: ["CSE-CS308E"], credits: 3, type: "Elective", departments: ["CSE"], semester: 6, lecturesPerWeek: 3 },
    { name: "Cloud Computing", codes: ["CSE-CS401"], credits: 3, type: "Core", departments: ["CSE"], semester: 7, lecturesPerWeek: 3 },
    { name: "Big Data Analytics", codes: ["CSE-CS402E"], credits: 3, type: "Elective", departments: ["CSE"], semester: 7, lecturesPerWeek: 3 },
    { name: "Internet of Things", codes: ["CSE-CS403E"], credits: 3, type: "Elective", departments: ["CSE"], semester: 7, lecturesPerWeek: 3 },
    { name: "Blockchain Technology", codes: ["CSE-CS405E"], credits: 3, type: "Elective", departments: ["CSE"], semester: 8, lecturesPerWeek: 3 },
    { name: "Natural Language Processing", codes: ["CSE-CS406E"], credits: 3, type: "Elective", departments: ["CSE"], semester: 8, lecturesPerWeek: 3 },

    // IT
    { name: "Engineering Mathematics I", codes: ["IT-MA101"], credits: 4, type: "Core", departments: ["IT"], semester: 1, lecturesPerWeek: 4 },
    { name: "Programming Fundamentals", codes: ["IT-IT101"], credits: 3, type: "Core", departments: ["IT"], semester: 1, lecturesPerWeek: 3 },
    { name: "Engineering Chemistry", codes: ["IT-CH101"], credits: 3, type: "Core", departments: ["IT"], semester: 1, lecturesPerWeek: 3 },
    { name: "Technical Writing", codes: ["IT-EN101"], credits: 2, type: "Core", departments: ["IT"], semester: 1, lecturesPerWeek: 2 },
    { name: "Programming Lab", codes: ["IT-IT101L"], credits: 2, type: "Lab", departments: ["IT"], semester: 1, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Engineering Mathematics II", codes: ["IT-MA102"], credits: 4, type: "Core", departments: ["IT"], semester: 2, lecturesPerWeek: 4 },
    { name: "Data Structures", codes: ["IT-IT102"], credits: 4, type: "Core", departments: ["IT"], semester: 2, lecturesPerWeek: 4 },
    { name: "Computer Architecture", codes: ["IT-IT103"], credits: 3, type: "Core", departments: ["IT"], semester: 2, lecturesPerWeek: 3 },
    { name: "Data Structures Lab", codes: ["IT-IT102L"], credits: 2, type: "Lab", departments: ["IT"], semester: 2, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Database Systems", codes: ["IT-IT201"], credits: 4, type: "Core", departments: ["IT"], semester: 3, lecturesPerWeek: 4 },
    { name: "Operating Systems", codes: ["IT-IT202"], credits: 4, type: "Core", departments: ["IT"], semester: 3, lecturesPerWeek: 4 },
    { name: "Computer Networks I", codes: ["IT-IT203"], credits: 3, type: "Core", departments: ["IT"], semester: 3, lecturesPerWeek: 3 },
    { name: "Database Lab", codes: ["IT-IT201L"], credits: 2, type: "Lab", departments: ["IT"], semester: 3, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Software Engineering", codes: ["IT-IT204"], credits: 4, type: "Core", departments: ["IT"], semester: 4, lecturesPerWeek: 4 },
    { name: "Web Development", codes: ["IT-IT206"], credits: 3, type: "Core", departments: ["IT"], semester: 4, lecturesPerWeek: 3 },
    { name: "Network Security", codes: ["IT-IT207E"], credits: 3, type: "Elective", departments: ["IT"], semester: 4, lecturesPerWeek: 3 },
    { name: "Web Development Lab", codes: ["IT-IT206L"], credits: 2, type: "Lab", departments: ["IT"], semester: 4, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Cloud Computing", codes: ["IT-IT301"], credits: 3, type: "Core", departments: ["IT"], semester: 5, lecturesPerWeek: 3 },
    { name: "Mobile App Development", codes: ["IT-IT302"], credits: 3, type: "Core", departments: ["IT"], semester: 5, lecturesPerWeek: 3 },
    { name: "Cyber Security", codes: ["IT-IT303E"], credits: 3, type: "Elective", departments: ["IT"], semester: 5, lecturesPerWeek: 3 },
    { name: "DevOps", codes: ["IT-IT305"], credits: 3, type: "Core", departments: ["IT"], semester: 6, lecturesPerWeek: 3 },
    { name: "IoT Systems", codes: ["IT-IT307E"], credits: 3, type: "Elective", departments: ["IT"], semester: 6, lecturesPerWeek: 3 },
    { name: "Big Data Technologies", codes: ["IT-IT402E"], credits: 3, type: "Elective", departments: ["IT"], semester: 7, lecturesPerWeek: 3 },

    // ECE
    { name: "Engineering Mathematics I", codes: ["ECE-MA101"], credits: 4, type: "Core", departments: ["ECE"], semester: 1, lecturesPerWeek: 4 },
    { name: "Basic Electrical Engineering", codes: ["ECE-EE101"], credits: 3, type: "Core", departments: ["ECE"], semester: 1, lecturesPerWeek: 3 },
    { name: "Engineering Physics", codes: ["ECE-PH101"], credits: 3, type: "Core", departments: ["ECE"], semester: 1, lecturesPerWeek: 3 },
    { name: "Programming in C", codes: ["ECE-CS101"], credits: 3, type: "Core", departments: ["ECE"], semester: 1, lecturesPerWeek: 3 },
    { name: "Physics Lab", codes: ["ECE-PH101L"], credits: 1, type: "Lab", departments: ["ECE"], semester: 1, lecturesPerWeek: 1, labsPerWeek: 1 },
    { name: "Engineering Mathematics II", codes: ["ECE-MA102"], credits: 4, type: "Core", departments: ["ECE"], semester: 2, lecturesPerWeek: 4 },
    { name: "Circuit Theory", codes: ["ECE-EC101"], credits: 4, type: "Core", departments: ["ECE"], semester: 2, lecturesPerWeek: 4 },
    { name: "Electronic Devices", codes: ["ECE-EC102"], credits: 3, type: "Core", departments: ["ECE"], semester: 2, lecturesPerWeek: 3 },
    { name: "Circuit Lab", codes: ["ECE-EC101L"], credits: 2, type: "Lab", departments: ["ECE"], semester: 2, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Digital Electronics", codes: ["ECE-EC201"], credits: 4, type: "Core", departments: ["ECE"], semester: 3, lecturesPerWeek: 4 },
    { name: "Signals and Systems", codes: ["ECE-EC202"], credits: 4, type: "Core", departments: ["ECE"], semester: 3, lecturesPerWeek: 4 },
    { name: "Network Analysis", codes: ["ECE-EC204"], credits: 3, type: "Core", departments: ["ECE"], semester: 3, lecturesPerWeek: 3 },
    { name: "Digital Electronics Lab", codes: ["ECE-EC201L"], credits: 2, type: "Lab", departments: ["ECE"], semester: 3, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Analog Circuits", codes: ["ECE-EC205"], credits: 4, type: "Core", departments: ["ECE"], semester: 4, lecturesPerWeek: 4 },
    { name: "Control Systems", codes: ["ECE-EC206"], credits: 4, type: "Core", departments: ["ECE"], semester: 4, lecturesPerWeek: 4 },
    { name: "Communication Engineering", codes: ["ECE-EC207"], credits: 3, type: "Core", departments: ["ECE"], semester: 4, lecturesPerWeek: 3 },
    { name: "Analog Circuits Lab", codes: ["ECE-EC205L"], credits: 2, type: "Lab", departments: ["ECE"], semester: 4, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Digital Signal Processing", codes: ["ECE-EC301"], credits: 4, type: "Core", departments: ["ECE"], semester: 5, lecturesPerWeek: 4 },
    { name: "Wireless Communication", codes: ["ECE-EC302"], credits: 3, type: "Core", departments: ["ECE"], semester: 5, lecturesPerWeek: 3 },
    { name: "VLSI Design", codes: ["ECE-EC303E"], credits: 3, type: "Elective", departments: ["ECE"], semester: 5, lecturesPerWeek: 3 },
    { name: "Embedded Systems", codes: ["ECE-EC304E"], credits: 3, type: "Elective", departments: ["ECE"], semester: 5, lecturesPerWeek: 3 },
    { name: "DSP Lab", codes: ["ECE-EC301L"], credits: 2, type: "Lab", departments: ["ECE"], semester: 5, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Optical Fiber Communication", codes: ["ECE-EC305"], credits: 3, type: "Core", departments: ["ECE"], semester: 6, lecturesPerWeek: 3 },
    { name: "Image Processing", codes: ["ECE-EC402E"], credits: 3, type: "Elective", departments: ["ECE"], semester: 7, lecturesPerWeek: 3 },

    // MECH
    { name: "Engineering Mathematics I", codes: ["MECH-MA101"], credits: 4, type: "Core", departments: ["MECH"], semester: 1, lecturesPerWeek: 4 },
    { name: "Engineering Mechanics", codes: ["MECH-ME101"], credits: 4, type: "Core", departments: ["MECH"], semester: 1, lecturesPerWeek: 4 },
    { name: "Engineering Drawing", codes: ["MECH-ME102"], credits: 3, type: "Core", departments: ["MECH"], semester: 1, lecturesPerWeek: 2 },
    { name: "Workshop Practice", codes: ["MECH-ME102L"], credits: 2, type: "Lab", departments: ["MECH"], semester: 1, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Engineering Mathematics II", codes: ["MECH-MA102"], credits: 4, type: "Core", departments: ["MECH"], semester: 2, lecturesPerWeek: 4 },
    { name: "Thermodynamics I", codes: ["MECH-ME103"], credits: 4, type: "Core", departments: ["MECH"], semester: 2, lecturesPerWeek: 4 },
    { name: "Material Science", codes: ["MECH-ME104"], credits: 3, type: "Core", departments: ["MECH"], semester: 2, lecturesPerWeek: 3 },
    { name: "Thermodynamics Lab", codes: ["MECH-ME103L"], credits: 2, type: "Lab", departments: ["MECH"], semester: 2, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Strength of Materials", codes: ["MECH-ME201"], credits: 4, type: "Core", departments: ["MECH"], semester: 3, lecturesPerWeek: 4 },
    { name: "Fluid Mechanics", codes: ["MECH-ME202"], credits: 4, type: "Core", departments: ["MECH"], semester: 3, lecturesPerWeek: 4 },
    { name: "Manufacturing Processes", codes: ["MECH-ME203"], credits: 3, type: "Core", departments: ["MECH"], semester: 3, lecturesPerWeek: 3 },
    { name: "Fluid Mechanics Lab", codes: ["MECH-ME202L"], credits: 2, type: "Lab", departments: ["MECH"], semester: 3, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "Machine Design I", codes: ["MECH-ME205"], credits: 4, type: "Core", departments: ["MECH"], semester: 4, lecturesPerWeek: 4 },
    { name: "Heat Transfer", codes: ["MECH-ME206"], credits: 4, type: "Core", departments: ["MECH"], semester: 4, lecturesPerWeek: 4 },
    { name: "Machine Design Lab", codes: ["MECH-ME205L"], credits: 2, type: "Lab", departments: ["MECH"], semester: 4, lecturesPerWeek: 1, labsPerWeek: 2 },
    { name: "CAD/CAM", codes: ["MECH-ME302E"], credits: 3, type: "Elective", departments: ["MECH"], semester: 5, lecturesPerWeek: 3 },
    { name: "Robotics", codes: ["MECH-ME306E"], credits: 3, type: "Elective", departments: ["MECH"], semester: 6, lecturesPerWeek: 3 },
];

const classroomsData = [
    { name: "Room-101", capacity: 65, type: "Lecture Hall", resources: ["Projector"] },
    { name: "Room-102", capacity: 65, type: "Lecture Hall", resources: ["Projector"] },
    { name: "Room-103", capacity: 60, type: "Lecture Hall", resources: ["Whiteboard"] },
    { name: "Room-201", capacity: 65, type: "Lecture Hall", resources: ["Projector"] },
    { name: "Room-202", capacity: 65, type: "Lecture Hall", resources: ["Smart Board"] },
    { name: "Room-203", capacity: 60, type: "Lecture Hall", resources: ["Whiteboard"] },
    { name: "Room-301", capacity: 70, type: "Lecture Hall", resources: ["Projector"] },
    { name: "Room-302", capacity: 70, type: "Lecture Hall", resources: ["Projector"] },
    { name: "Room-401", capacity: 65, type: "Lecture Hall", resources: ["Smart Board"] },
    { name: "Room-402", capacity: 65, type: "Lecture Hall", resources: ["Projector"] },
    { name: "Room-403", capacity: 60, type: "Lecture Hall", resources: ["Whiteboard"] },
    { name: "Room-404", capacity: 60, type: "Lecture Hall", resources: ["Projector"] },
    { name: "LH-A", capacity: 250, type: "Lecture Hall", resources: ["Projector", "AC"] },
    { name: "LH-B", capacity: 220, type: "Lecture Hall", resources: ["Projector", "AC"] },
    { name: "LH-C", capacity: 200, type: "Lecture Hall", resources: ["Projector", "AC"] },
    { name: "CSE-Lab-A", capacity: 40, type: "Laboratory", resources: ["Computers", "AC"] },
    { name: "CSE-Lab-B", capacity: 40, type: "Laboratory", resources: ["Computers", "AC"] },
    { name: "IT-Lab-A", capacity: 40, type: "Laboratory", resources: ["Computers", "AC"] },
    { name: "IT-Lab-B", capacity: 35, type: "Laboratory", resources: ["Computers"] },
    { name: "ECE-Lab-A", capacity: 30, type: "Laboratory", resources: ["Electronics Kit"] },
    { name: "ECE-Lab-B", capacity: 30, type: "Laboratory", resources: ["Electronics Kit"] },
    { name: "MECH-Lab-A", capacity: 30, type: "Laboratory", resources: ["Machines"] },
    { name: "MECH-Lab-B", capacity: 30, type: "Laboratory", resources: ["Machines"] },
];

const facultyData = [
    { name: "Dr. Arun Kumar", email: "arun@college.edu", department: "CSE", designation: "Professor", maxLoad: 14 },
    { name: "Dr. Priya Sharma", email: "priya@college.edu", department: "CSE", designation: "Associate Professor", maxLoad: 12 },
    { name: "Mr. Ravi Patel", email: "ravi@college.edu", department: "CSE", designation: "Assistant Professor", maxLoad: 12 },
    { name: "Ms. Sneha Gupta", email: "sneha@college.edu", department: "CSE", designation: "Assistant Professor", maxLoad: 10 },
    { name: "Dr. Karthik Mohan", email: "karthik@college.edu", department: "CSE", designation: "Professor", maxLoad: 14 },
    { name: "Ms. Divya Nair", email: "divya@college.edu", department: "CSE", designation: "Assistant Professor", maxLoad: 12 },
    { name: "Mr. Sanjay Rao", email: "sanjay@college.edu", department: "CSE", designation: "Associate Professor", maxLoad: 14 },
    { name: "Dr. Vinod Krishnan", email: "vinod@college.edu", department: "IT", designation: "Professor", maxLoad: 14 },
    { name: "Ms. Kavya Reddy", email: "kavya@college.edu", department: "IT", designation: "Associate Professor", maxLoad: 12 },
    { name: "Mr. Suresh Menon", email: "suresh@college.edu", department: "IT", designation: "Assistant Professor", maxLoad: 12 },
    { name: "Dr. Asha Pillai", email: "asha@college.edu", department: "IT", designation: "Professor", maxLoad: 14 },
    { name: "Mr. Nikhil Das", email: "nikhil@college.edu", department: "IT", designation: "Assistant Professor", maxLoad: 12 },
    { name: "Ms. Rekha Varma", email: "rekha@college.edu", department: "IT", designation: "Assistant Professor", maxLoad: 12 },
    { name: "Dr. Balaji Rao", email: "balaji@college.edu", department: "ECE", designation: "Professor", maxLoad: 14 },
    { name: "Ms. Geetha Iyer", email: "geetha@college.edu", department: "ECE", designation: "Associate Professor", maxLoad: 12 },
    { name: "Mr. Praveen Kumar", email: "praveen@college.edu", department: "ECE", designation: "Assistant Professor", maxLoad: 12 },
    { name: "Dr. Meena Sundar", email: "meena@college.edu", department: "ECE", designation: "Professor", maxLoad: 14 },
    { name: "Mr. Ajay Krishnan", email: "ajay@college.edu", department: "ECE", designation: "Assistant Professor", maxLoad: 12 },
    { name: "Ms. Latha S", email: "latha@college.edu", department: "ECE", designation: "Associate Professor", maxLoad: 14 },
    { name: "Dr. Harish Verma", email: "harish@college.edu", department: "MECH", designation: "Professor", maxLoad: 14 },
    { name: "Mr. Deepak Singh", email: "deepak@college.edu", department: "MECH", designation: "Assistant Professor", maxLoad: 12 },
    { name: "Dr. Ramesh Iyer", email: "ramesh@college.edu", department: "MECH", designation: "Professor", maxLoad: 14 },
    { name: "Ms. Pooja B", email: "pooja@college.edu", department: "MECH", designation: "Associate Professor", maxLoad: 14 },
    { name: "Mr. Vijay Anand", email: "vijay@college.edu", department: "MECH", designation: "Assistant Professor", maxLoad: 12 },
    { name: "Ms. Ananya P", email: "ananya@college.edu", department: "MECH", designation: "Assistant Professor", maxLoad: 12 },
];

const batchesData = [];
DEPARTMENTS.forEach(dept => {
    for (let year = 1; year <= 4; year++) {
        for (let semOffset = 1; semOffset <= 2; semOffset++) {
            const sem = (year - 1) * 2 + semOffset;
            const sections = (dept === "CSE" || dept === "IT") ? ["A", "B"] : ["A"];
            sections.forEach(sec => {
                batchesData.push({
                    name: `${dept}-Y${year}-S${sem}-${sec}`,
                    department: dept,
                    semester: sem,
                    section: sec,
                    studentsCount: Math.floor(Math.random() * (150 - 60 + 1)) + 60
                });
            });
        }
    }
});

const coordinatorsData = DEPARTMENTS.map(dept => ({
    name: `${dept} Coordinator`,
    email: `coordinator.${dept.toLowerCase()}@college.edu`,
    password: "password123",
    role: "COORDINATOR",
    coordinatorOf: dept
}));

// ── SEED LOGIC ────────────────────────────────────────────────────────────────

const seed = async () => {
    try {
        console.log("Connecting to MongoDB...");
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI not found in environment. Make sure you run from the backend root folder.");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.\n");

        // 1. Users (Admin + Coordinators)
        console.log("Seeding Users...");
        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash("password123", salt);

        await User.findOneAndUpdate(
            { email: "admin@example.com" },
            { name: "Admin User", password: adminPassword, role: "ADMIN" },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        for (const c of coordinatorsData) {
            const hashedPW = await bcrypt.hash(c.password, salt);
            await User.findOneAndUpdate(
                { email: c.email },
                { ...c, password: hashedPW },
                { upsert: true }
            );
        }
        const coords = await User.find({ role: "COORDINATOR" });
        console.log("✓ Users seeded.\n");

        // 2. Classrooms
        console.log("Seeding Classrooms...");
        for (const c of classroomsData) {
            await Classroom.findOneAndUpdate({ name: c.name }, c, { upsert: true });
        }
        console.log("✓ Classrooms seeded.\n");

        // 3. Subjects
        console.log("Seeding Subjects...");
        for (const s of subjectsData) {
            await Subject.findOneAndUpdate({ codes: { $in: s.codes } }, s, { upsert: true });
        }
        const allSubjects = await Subject.find();
        console.log("✓ Subjects seeded.\n");

        // 4. Faculty (Linked to Subjects)
        console.log("Seeding Faculty (linking to subjects)...");
        for (const f of facultyData) {
            // Find subjects in their department
            const deptSubjects = allSubjects.filter(s => s.departments.includes(f.department));
            // Randomly assign 5 subjects they can teach
            const assigned = deptSubjects.sort(() => 0.5 - Math.random()).slice(0, 5).map(s => s._id);
            await Faculty.findOneAndUpdate(
                { email: f.email },
                { ...f, subjects: assigned },
                { upsert: true }
            );
        }
        console.log("✓ Faculty seeded with linked subjects.\n");

        // 5. Batches (Linked to Subjects and Coordinators)
        console.log("Seeding Batches (linking to subjects correctly)...");
        for (const b of batchesData) {
            // Find subjects for this department AND semester
            const batchSubjects = allSubjects.filter(s =>
                s.departments.includes(b.department) && s.semester === b.semester
            ).map(s => s._id);

            // Find coordinator for this department
            const coord = coords.find(c => c.coordinatorOf === b.department);

            await Batch.findOneAndUpdate(
                { name: b.name },
                { ...b, subjects: batchSubjects, coordinator: coord ? coord._id : null },
                { upsert: true }
            );
        }
        console.log("✓ Batches seeded with linked subjects and coordinators.\n");

        console.log("🎉 SUCCESS: Realistic dataset seeded!");
        console.log(`- Depts: ${DEPARTMENTS.join(", ")}`);
        console.log(`- Subjects: ${allSubjects.length}`);
        console.log(`- Faculty: ${facultyData.length}`);
        console.log(`- Batches: ${batchesData.length}`);
        console.log(`- Rooms: ${classroomsData.length}`);

        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
};

seed();
