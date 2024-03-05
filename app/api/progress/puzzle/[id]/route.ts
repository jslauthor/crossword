import { currentUser } from '@clerk/nextjs';
import { getUserForClerkId, upsertPuzzleProgress } from 'lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // defaults to force-static
export async function PUT(
  request: Request,
  context: { params: { id: string } },
) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = (await request.json()) as PrismaJson.ProgressType;
  const user = await getUserForClerkId(clerkUser.id);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;
  const storedProgress = await prisma.progress.findFirst({
    where: {
      userId: user?.id,
      puzzleId: id,
    },
  });

  if (storedProgress != null) {
    // Merge the current progress with the new progress and honor the timestamps
    for (const [key, { timestamp }] of Object.entries(data)) {
      let storedTimestamp = -1;
      if (storedProgress.data[key as keyof typeof data] != null) {
        storedTimestamp =
          storedProgress.data[key as keyof typeof data].timestamp;
      }

      if (storedTimestamp > timestamp) {
        data[key as keyof typeof data].value =
          storedProgress.data[key as keyof typeof data].value;
        data[key as keyof typeof data].timestamp =
          storedProgress.data[key as keyof typeof data].timestamp;
      }
    }
  }

  const progress = await upsertPuzzleProgress(id, user.id, data);
  return NextResponse.json(progress.data, { status: 200 });
}
