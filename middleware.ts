import { authMiddleware, useAuth } from '@clerk/nextjs';
import {
  NextFetchEvent,
  NextMiddleware,
  NextRequest,
  NextResponse,
} from 'next/server';

// export function middleware(request: NextRequest) {
//   console.log('lol!!!');
// }

// export const config = {
//   matcher: '/(.*)/',
// };

export default authMiddleware({
  publicRoutes: ['/(.*)/'],
  beforeAuth: () => {
    console.log('beforeAuth');
    return false;
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
