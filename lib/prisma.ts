import { PrismaClient } from '@prisma/client/edge';

let prisma: PrismaClient;

if (process.env.VERCEL_ENV === 'production' || global == null) {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
