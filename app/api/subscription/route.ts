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
    const successful = await updateSubscription(user, body.isSubscribed);
    if (successful === false) {
      throw new Error('Failed to update subscription in Loops.so');
    }

    return NextResponse.json({
      message: 'Subscription updated successfully',
      userId: user.id,
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
    const url = new URL('https://app.loops.so/api/v1/contacts/find');
    url.searchParams.append('userId', user.id);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data from Loops.so');
    }

    const userData = await findContact(user.id);

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isSubscribed = userData.subscribed;

    return NextResponse.json({ isSubscribed });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
