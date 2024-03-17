import { currentUser } from '@clerk/nextjs';
import { getUserForClerkId, upsertPuzzleProgress } from 'lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // defaults to force-static
export async function PUT(
  request: Request,
  context: { params: { id: string } },
) {
  // const clerkUser = await currentUser();
  // if (!clerkUser) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  // const data = (await request.json()) as PrismaJson.ProgressType;
  // const user = await getUserForClerkId(clerkUser.id);
  // if (!user) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  // const { id } = context.params;
  // const storedProgress = await prisma.progress.findFirst({
  //   where: {
  //     userId: user?.id,
  //     puzzleId: id,
  //   },
  // });
  // let usedHint = undefined;
  // if (storedProgress != null) {
  //   // Merge the current progress with the new progress and honor the timestamps
  //   for (const [key, { timestamp }] of Object.entries(data)) {
  //     let storedTimestamp = -1;
  //     if (storedProgress.data[key as keyof typeof data] != null) {
  //       storedTimestamp =
  //         storedProgress.data[key as keyof typeof data].timestamp;
  //     }
  //     if (storedTimestamp > timestamp) {
  //       data[key as keyof typeof data].value =
  //         storedProgress.data[key as keyof typeof data].value;
  //       data[key as keyof typeof data].timestamp =
  //         storedProgress.data[key as keyof typeof data].timestamp;
  //     }
  //   }
  //   if (storedProgress.usedHint === false && data.validations.value != null) {
  //     usedHint = Object.values(data.validations.value).some(
  //       (v: number) => v > 0, // If any of the validations are greater than 0, then a hint was used
  //     );
  //   }
  // }
  // const progress = await upsertPuzzleProgress(id, user.id, data, usedHint);
  // return NextResponse.json(progress.data, { status: 200 });
}
