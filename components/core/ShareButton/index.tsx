import React from 'react';
import { Button } from '../ui/button';
import { Share } from 'lucide-react';

interface ShareButtonProps {
  onClick: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ onClick }) => {
  return (
    <Button size="share" onClick={onClick}>
      Share
      <Share size={12} />
    </Button>
  );
};

export default ShareButton;
