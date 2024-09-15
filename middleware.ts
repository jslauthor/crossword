import { clerkMiddleware, clerkClient } from '@clerk/nextjs/server';
import kv from 'lib/kv';
import { createContact, findContact } from 'lib/loops';
import prisma from 'lib/prisma';
import { NextResponse } from 'next/server';

export const HEADER_X_USER_SUBSCRIBED = 'X-User-Subscribed';

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();
  const response = NextResponse.next();

  // Handle redirects for crossmoji.app and its subdomains
  const url = req.nextUrl.clone();
  if (
    url.hostname === 'crossmoji.app' ||
    url.hostname.endsWith('.crossmoji.app')
  ) {
    const newHostname =
      url.hostname === 'crossmoji.app'
        ? 'crosscube.app'
        : url.hostname.replace('.crossmoji.app', '.crosscube.app');

    if (url.pathname === '/' || url.pathname === '') {
      // Redirect root path to /crosscube/latest/moji
      url.hostname = newHostname;
      url.pathname = '/crosscube/latest/moji';
      return NextResponse.redirect(url, 301);
    } else {
      // Redirect all other paths to the same path on crosscube.app
      url.hostname = newHostname;
      return NextResponse.redirect(url, 301);
    }
  }

  // Sync user to local DB
  if (userId != null) {
    const user = await clerkClient().users.getUser(userId);
    const hasSyncedUser = await kv.get(`user-synced:${user.id}`);
    if (!hasSyncedUser) {
      try {
        const localUser = await prisma.user.findFirst({
          where: {
            clerkId: user.id,
          },
        });

        if (localUser == null) {
          await prisma.user.create({
            data: {
              clerkId: user.id,
            },
          });
        }
        // Set a flag in KV store to indicate this user has been synced
        await kv.set(`user-synced:${user.id}`, true);
      } catch (e) {
        console.error('Error syncing user:', e);
      }
    }

    // Find existing loops.so contact
    const loopsUser = await findContact(user.emailAddresses[0].emailAddress);

    if (Array.isArray(loopsUser) && loopsUser.length > 0) {
      response.headers.set(
        HEADER_X_USER_SUBSCRIBED,
        loopsUser[0].subscribed === true ? '1' : '0',
      );
    }

    if (
      loopsUser == null ||
      (Array.isArray(loopsUser) && loopsUser.length === 0)
    ) {
      try {
        // Create if not found
        const createdLoopsUser = await createContact(
          user.id,
          user.emailAddresses[0].emailAddress,
          user.firstName ?? undefined,
          user.lastName ?? undefined,
          process.env.VERCEL_ENV,
        );
        if (
          createdLoopsUser.success === false &&
          createdLoopsUser.message !== 'Email or userId is already on list.'
        ) {
          throw new Error('Failed to create contact in Loops.so!');
        }
      } catch (e) {
        console.error('Error syncing loops:', e);
      }
    }
  }

  // Set some useful headers
  response.headers.set('x-url', req.url);
  response.headers.set('x-origin', url.origin);
  response.headers.set('x-host', url.host);
  response.headers.set('x-pathname', url.pathname);

  return response;
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
