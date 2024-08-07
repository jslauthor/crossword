import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { findContact, updateSubscription } from 'lib/loops';

export async function PUT(request: NextRequest) {
  const user = await currentUser();

  if (user == null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: { isSubscribed: boolean } = await request.json();

  if (typeof body.isSubscribed !== 'boolean') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const successful = await updateSubscription(
      user.emailAddresses[0].emailAddress,
      body.isSubscribed,
    );
    if (successful === false) {
      throw new Error('Failed to update subscription in Loops.so');
    }

    return NextResponse.json({
      message: 'Subscription updated successfully',
      userId: user.id,
      isSubscribed: body.isSubscribed,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function GET() {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userData = await findContact(user.id);

    if (!userData || (Array.isArray(userData) && userData.length === 0)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isSubscribed = userData[0].subscribed;

    return NextResponse.json({ isSubscribed });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
