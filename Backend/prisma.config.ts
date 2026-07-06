import dotenv from "dotenv";
import { defineConfig } from "@prisma/config";

dotenv.config();

export default defineConfig({
  schema: "./schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
