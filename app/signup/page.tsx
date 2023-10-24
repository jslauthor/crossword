'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';

const Page: React.FC = () => {
  const path = usePathname();
  const params = useSearchParams();
  return <SignUp redirectUrl={params.get('redirect_url') ?? '/'} path={path} />;
};

export default Page;
