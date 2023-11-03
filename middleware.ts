import { authMiddleware, redirectToSignIn, useAuth } from '@clerk/nextjs';
import {
  NextFetchEvent,
  NextMiddleware,
  NextRequest,
  NextResponse,
} from 'next/server';

export default authMiddleware({
  publicRoutes: ['/(.*)/'],
  beforeAuth: (req, evt) => {
    console.log('beforeAuth', req);
  },
  afterAuth: async (auth, req, evt) => {
    // Redirect to login is user is not logged in
    // if (!auth.userId && !auth.isPublicRoute) {
    //   return redirectToSignIn({ returnBackUrl: req.url });
    // }

    console.log('afterAuth', auth);
    // Sync user to local DB
    if (auth.userId) {
      // TODO: Cache this call
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

    // TODO: Return local user to every request
  },
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
  // matcher: ['/(api|trpc)(.*)'],
  // matcher: ['/(.*)/'],
};

// type MiddlewareFactory = (next: NextMiddleware) => NextMiddleware;

// export function stackMiddlewares(
//   functions: MiddlewareFactory[] = [],
//   index = 0
// ): NextMiddleware {
//   const current = functions[index];
//   console.log(index);
//   if (current) {
//     const next = stackMiddlewares(functions, index + 1);
//     return current(next);
//   }
//   return () => NextResponse.next();
// }

// export default stackMiddlewares([
//   () => {
//     console.log('authMiddleware');
//     return authMiddleware({});
//   },
//   (next: NextMiddleware) =>
//     async (request: NextRequest, _next: NextFetchEvent) => {
//       const { userId } = useAuth();
//       console.log('ID!!', userId);
//       return next(request, _next);
//     },
// ]);

// export const config = {
//   // matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
//   matcher: ['/(api|trpc)(.*)'],
// };
