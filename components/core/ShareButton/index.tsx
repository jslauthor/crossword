import React from 'react';
import { Button } from '../ui/button';
import { Share } from 'lucide-react';

interface ShareButtonProps {
  onClick: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ onClick }) => {
  return (
    <Button size="share" onClick={onClick}>
      <div className="flex gap-2 justify-center items-center">
        Share
        <Share size={16} />
      </div>
    </Button>
  );
};

export default ShareButton;
