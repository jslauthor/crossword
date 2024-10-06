import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from 'components/core/ui/drawer';
import React, { useCallback } from 'react';
import { Button } from 'components/core/ui/button';
import Image from 'next/image';

interface PuzzlePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: (val: boolean) => void;
}

const PuzzlePrompt: React.FC<PuzzlePromptProps> = ({
  isOpen,
  onClose,
  onDontShowAgain,
}) => {
  const onDisableTryAgain = useCallback(() => {
    onDontShowAgain(true);
  }, [onDontShowAgain]);

  return (
    <Drawer open={isOpen} onClose={onClose} setBackgroundColorOnScale={false}>
      <DrawerContent className="mb-8">
        <DrawerHeader className="flex flex-col justify-center items-center max-w-22 w-full my-6 p-0 gap-1">
          <Image
            src="/noto/svg/emoji_u1f7e6.svg"
            alt="blue square"
            width={32}
            height={32}
            className="mb-3"
          />
          <DrawerTitle className="text-2xl italic">
            you&apos;re close!
          </DrawerTitle>
          <DrawerDescription className="text-center leading-4">
            The puzzle is filled but,
            <br /> at least one square is amiss.
          </DrawerDescription>
          <Button className="max-w-64 w-full mt-4" onClick={onClose}>
            Keep Trying
          </Button>
          <div className="flex items-center space-x-2 mt-4">
            <div
              className="text-sm font-medium leading-none cursor-pointer hover:opacity-50 transition-opacity duration-200"
              onClick={onDisableTryAgain}
            >
              Don&apos;t show again for this puzzle
            </div>
          </div>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
};

export default PuzzlePrompt;
