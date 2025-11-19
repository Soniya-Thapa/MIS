
import app from "./src/app.js"
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Start server
async function startServer() {
  try {
    const PORT = process.env.PORT || 5000;

    await prisma.$connect();
    console.log('Database connection has been established successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();