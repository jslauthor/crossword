import { clerkMiddleware } from '@clerk/nextjs/server';
import prisma from 'lib/prisma';

export default clerkMiddleware(async (auth) => {
  // Sync user to local DB
  if (auth().userId) {
    const localUser = await prisma.user.findFirst({
      where: {
        clerkId: auth().userId,
      },
    });

    if (localUser == null) {
      await prisma.user.create({
        data: {
          clerkId: auth().userId,
        },
      });
    }
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
