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
import { Loader } from 'lucide-react';
import { Spinner } from 'components/core/ui/spinner';

interface UserSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSubscribed: boolean;
  isLoading: boolean;
  onSubscribedChange: (isSubscribed: boolean) => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({
  isOpen,
  onOpenChange,
  isSubscribed,
  onSubscribedChange,
  isLoading,
}) => {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="mb-8">
        <DrawerHeader className="flex flex-col justify-center items-center max-w-22 w-full my-6 p-0 gap-1">
          <DrawerTitle className="text-base font-normal">
            User Settings
          </DrawerTitle>
        </DrawerHeader>
        <div className="w-full flex flex-col justify-center items-center mb-1 ">
          <div className="max-w-[var(--max-app-width)] w-full flex flex-col gap-2 justify-center ">
            <SettingsTitle>Other</SettingsTitle>
            <HRule />
            <SettingsItem>
              <div className="text-base">Crosscube Updates</div>
              <div className="flex flex-row gap-2">
                {isLoading && <Spinner size="small" />}
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={onSubscribedChange}
                  disabled={isLoading}
                />
              </div>
            </SettingsItem>
            <HRule />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default UserSettings;
