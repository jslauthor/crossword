import React from 'react';
import { Button } from 'components/core/ui/button';
import Image from 'next/image';
import { OutlineCard } from '../OutlineCard';

export interface GetUpdatesCardProps {
  onSignUp?: () => void;
  onNotNow?: () => void;
}

const GetUpdatesCard: React.FC<GetUpdatesCardProps> = ({
  onSignUp,
  onNotNow,
}) => {
  return (
    <OutlineCard>
      <>
        <div className="text-center flex flex-col gap-2 items-center">
          <Image
            src="/noto/svg/emoji_u1f4e8.svg"
            alt="eamail inbox"
            width={48}
            height={48}
          />
          <h1 className="text-[2rem] italic font-semibold">get updates!</h1>
          <span className="text-[1rem] leading-5 max-w-[320px]">
            Get the inside scoop on new updates, daily puzzles, and more.
          </span>
        </div>
        <div className="w-full flex flex-col gap-3 items-center">
          <Button
            variant="inverted"
            className="w-full"
            size="share"
            onClick={onSignUp}
          >
            Sign Up
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="share"
            onClick={onNotNow}
          >
            Not Now
          </Button>
        </div>
      </>
    </OutlineCard>
  );
};

export default GetUpdatesCard;
