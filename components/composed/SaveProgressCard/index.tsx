import React from 'react';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'components/core/ui/button';
import Image from 'next/image';
import { OutlineCard } from '../OutlineCard';

export interface SaveProgressCardProps {
  onAuthClick?: () => void;
}

const SaveProgressCard: React.FC<SaveProgressCardProps> = ({ onAuthClick }) => {
  return (
    <OutlineCard>
      <>
        <div className="text-center flex flex-col gap-2 items-center">
          <Image
            src="/noto/svg/emoji_u2705.svg"
            alt="blue square"
            width={48}
            height={48}
          />
          <h1 className="text-[2rem] italic font-semibold">
            save your progress!
          </h1>
          <span className="text-[1rem] leading-5 max-w-[320px]">
            Create an account to save progress and track your solves and stars.
          </span>
        </div>
        <Button
          variant="inverted"
          className="w-full"
          size="share"
          onClick={onAuthClick}
        >
          Sign in or Sign Up{' '}
          <FontAwesomeIcon icon={faUser} size="sm" className="ml-2" />
        </Button>
      </>
    </OutlineCard>
  );
};

export default SaveProgressCard;
