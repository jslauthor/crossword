import { User } from '@clerk/backend';

export type ContactType = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  source: string;
  subscribed: boolean;
  userGroup: string;
  userId: string | null;
};

export const findContact = async (
  email: string,
): Promise<ContactType | null> => {
  try {
    const url = new URL('https://app.loops.so/api/v1/contacts/find');
    url.searchParams.append('email', email);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data from Loops.so');
    }

    return await response.json();
  } catch (e) {
    console.error('Error fetching user data:', e);
    return null;
  }
};

type CreateContactResponse = {
  success: boolean;
  id?: string;
  message?: string;
};

export const createContact = async (
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  userGroup?: string,
): Promise<CreateContactResponse> => {
  try {
    const url = new URL('https://app.loops.so/api/v1/contacts/create');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        email: email,
        firstName,
        lastName,
        userId: userId,
        subscribed: false,
        userGroup,
      }),
    });

    return await response.json();
  } catch (e) {
    console.error('Error creating user:', e);
    return { success: false, message: 'Unknown error' };
  }
};

export const updateSubscription = async (
  email: string,
  subscribed: boolean,
): Promise<boolean> => {
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
          email,
          subscribed,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to update subscription in Loops.so');
    }

    return true;
  } catch (e) {
    console.error('Error updating subscription:', e);
    return false;
  }
};
