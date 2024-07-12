console.log(
  process.env.NODE_ENV,
  process.env.NODE_ENV === 'production' ? 3600 : 0,
);

export async function queryReadOnly<T = {}>(
  query: string,
  variables: Record<string, any> = {},
): Promise<T> {
  const res = await fetch(
    'https://us-west-2.cdn.hygraph.com/content/cly83hf2e01ad07waoq2pzj2p/master',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.HYGRAPH_API_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      next: {
        revalidate: process.env.NODE_ENV === 'production' ? 3600 : 0, // revalidate every hour in production
      },
    },
  );

  const json = await res.json();

  if (json.errors) {
    console.error(json.errors);
    throw new Error('Failed to fetch API');
  }

  return json.data;
}
