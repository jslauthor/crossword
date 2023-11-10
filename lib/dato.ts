import { cache } from 'react';

const dedupedFetch = cache(async (serializedInit: string) => {
  const response = await fetch(
    'https://graphql.datocms.com/',
    JSON.parse(serializedInit),
  );
  const responseBody = await response.json();
  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText}: ${JSON.stringify(
        responseBody,
      )}`,
    );
  }
  return responseBody;
});

export async function queryDato({
  query,
  variables = {},
  includeDrafts = false,
  excludeInvalid = false,
  visualEditingBaseUrl,
  revalidate,
}: {
  query: string;
  variables?: Record<string, any>;
  includeDrafts?: boolean;
  excludeInvalid?: boolean;
  visualEditingBaseUrl?: string;
  revalidate?: number;
}) {
  const { data } = await dedupedFetch(
    JSON.stringify({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DATO_CMS_API_TOKEN}`,
        ...(includeDrafts ? { 'X-Include-Drafts': 'true' } : {}),
        ...(excludeInvalid ? { 'X-Exclude-Invalid': 'true' } : {}),
        ...(visualEditingBaseUrl
          ? {
              'X-Visual-Editing': 'vercel-v1',
              'X-Base-Editing-Url': visualEditingBaseUrl,
            }
          : {}),
        ...(process.env.DATO_CMS_ENVIRONMENT
          ? { 'X-Environment': process.env.DATO_CMS_ENVIRONMENT }
          : {}),
      },
      body: JSON.stringify({ query, variables, revalidate }),
      next: { revalidate },
    }),
  );
  return data;
}
