import { Button } from 'components/core/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center flex-col gap-4 justify-center w-svh h-svh">
      <h2 className="font-semibold text-lg">Puzzle Not Found!</h2>
      <Link href="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
