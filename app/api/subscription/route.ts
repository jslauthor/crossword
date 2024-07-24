import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

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
    const response = await fetch(
      'https://app.loops.so/api/v1/contacts/update',
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.primaryEmailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          userId: user.id,
          userGroup: body.isSubscribed ? ['subscribed'] : [''],
        }),
      },
    );

    if (!response.ok) {
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

    const userData = await response.json();
    const isSubscribed = userData.groups.includes('subscribed');

    return NextResponse.json({ isSubscribed });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
