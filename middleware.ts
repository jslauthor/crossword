import { clerkMiddleware, clerkClient } from '@clerk/nextjs/server';
import kv from 'lib/kv';
import { createContact, findContact } from 'lib/loops';
import prisma from 'lib/prisma';

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();

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

    const hasSyncedLoops = await kv.get(`email-synced:${user.id}`);
    if (!hasSyncedLoops) {
      try {
        // Find existing loops.so contact
        const loopsUser = await findContact(
          user.emailAddresses[0].emailAddress,
        );
        // Create if not found
        if (
          loopsUser == null ||
          (Array.isArray(loopsUser) && loopsUser.length === 0)
        ) {
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

          // Set a flag in KV store to indicate this user has been synced
          await kv.set(`email-synced:${user.id}`, true);
        }
      } catch (e) {
        console.error('Error syncing loops:', e);
      }
    }
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
