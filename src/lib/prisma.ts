import { PrismaClient } from "@prisma/client";
import { withDatabaseConnectTimeout } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = withDatabaseConnectTimeout(process.env.DATABASE_URL);
  if (url) {
    return new PrismaClient({
      datasources: { db: { url } },
    });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
