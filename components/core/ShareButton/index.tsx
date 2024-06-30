import React, { useCallback, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Share } from 'lucide-react';

interface ShareButtonProps {
  onClick: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ onClick }) => {
  const timerRef = useRef<NodeJS.Timeout>();
  const [shareLabel, setShareLabel] = useState('Share');

  const handleClipboard = useCallback(() => {
    if (onClick) {
      onClick();
    }
    if (navigator.share == null) {
      clearTimeout(timerRef.current);
      setShareLabel('Copied!');
      timerRef.current = setTimeout(() => {
        setShareLabel('Share');
      }, 2000);
    }
  }, [onClick]);

  return (
    <Button size="share" onClick={handleClipboard}>
      <div className="flex gap-2 justify-center items-center">
        {shareLabel}
        <Share size={16} />
      </div>
    </Button>
  );
};

export default ShareButton;
