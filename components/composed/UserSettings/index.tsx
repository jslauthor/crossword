import { HRule } from 'components/core/Dividers';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from 'components/core/ui/drawer';
import React from 'react';
import { SettingsItem, SettingsTitle } from '../PuzzleSettings';
import { Switch } from 'components/core/ui/switch';

interface UserSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSubscribed: boolean;
  onSubscribedChange: (isSubscribed: boolean) => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({
  isOpen,
  onOpenChange,
  isSubscribed,
  onSubscribedChange,
}) => {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="mb-8">
        <DrawerHeader className="flex flex-col justify-center items-center max-w-22 w-full my-6 p-0 gap-1">
          <DrawerTitle className="text-base font-normal">
            Notifications
          </DrawerTitle>
        </DrawerHeader>
        <div className="w-full flex flex-col justify-center items-center mb-1 ">
          <div className="max-w-[var(--max-app-width)] w-full flex flex-col gap-2 justify-center ">
            <SettingsTitle>Other</SettingsTitle>
            <HRule />
            <SettingsItem>
              <div className="text-base">Crosscube Updates</div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={onSubscribedChange}
              />
            </SettingsItem>
            <HRule />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default UserSettings;
