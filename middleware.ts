import { authMiddleware } from '@clerk/nextjs';
import prisma from 'lib/prisma';

export default authMiddleware({
  publicRoutes: ['/(.*)/'],
  afterAuth: async (auth, req, evt) => {
    // Redirect to login is user is not logged in
    // if (!auth.userId && !auth.isPublicRoute) {
    //   return redirectToSignIn({ returnBackUrl: req.url });
    // }

    // Sync user to local DB
    if (auth.userId) {
      const localUser = await prisma.user.findFirst({
        where: {
          clerkId: auth.userId,
        },
      });

      if (localUser == null) {
        await prisma.user.create({
          data: {
            clerkId: auth.userId,
          },
        });
      }
    }
  },
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
