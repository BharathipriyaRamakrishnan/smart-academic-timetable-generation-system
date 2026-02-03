import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import classroomRoutes from "./routes/classroom.routes.js";
import facultyRoutes from "./routes/faculty.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import batchRoutes from "./routes/batch.routes.js";
import timetableRoutes from "./routes/timetable.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/timetables", timetableRoutes);

export default app;
