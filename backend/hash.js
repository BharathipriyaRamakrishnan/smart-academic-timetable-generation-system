import bcrypt from "bcryptjs";

const run = async () => {
    const hashed = await bcrypt.hash("Admin@123", 10);
    console.log(hashed);
};

run();
