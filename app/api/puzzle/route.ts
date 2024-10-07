import { NextRequest, NextResponse } from 'next/server';
import { convert } from 'url-slug';
import { createUniqueEmojiList } from 'lib/utils/puzzle';
import emojiUnicodeList from 'lib/emojiUnicodeList.mjs';
import { CrossmojiDataV2 } from 'types/types';

const HYGRAPH_CROSSCUBE_URL = process.env.HYGRAPH_CROSSCUBE_URL ?? '';
const HYGRAPH_API_TOKEN = process.env.HYGRAPH_API_TOKEN;
const GUMLOOP_FLOW_TOKEN = process.env.GUMLOOP_FLOW_TOKEN;

export async function POST(request: NextRequest) {
  // Check for authorization
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${GUMLOOP_FLOW_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: Omit<CrossmojiDataV2, 'svgSegments'> = await request.json();

    // Add svgSegments to the data
    const data: CrossmojiDataV2 = {
      ...body,
      svgSegments: createUniqueEmojiList(
        Object.values(body.response.values).map(({ value }) => value),
        emojiUnicodeList,
      ),
    };

    // Send the converted data to Hygraph
    const hygraphResponse = await fetch(HYGRAPH_CROSSCUBE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HYGRAPH_API_TOKEN}`,
      },
      body: JSON.stringify({
        query: `
          mutation CreateCrosscube($input: CrosscubeCreateInput!) {
            createCrosscube(data: $input) {
              id
              title
              slug
              theme
            }
          }
        `,
        variables: {
          input: {
            title: data.response.title,
            slug: convert(data.response.title),
            data,
            theme: data.response.theme,
            authors: { connect: [{ id: 'clyc3wx0ru09807lmuveswsel' }] },
          },
        },
      }),
    });

    if (!hygraphResponse.ok) {
      const errorMessage = await hygraphResponse.json();
      throw new Error(
        `Failed to create Crossmoji in Hygraph: ${JSON.stringify(errorMessage)}`,
      );
    }

    const result = await hygraphResponse.json();

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error processing Crossmoji data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
