import RotatingBox, { RotatingBoxProps } from 'components/core/3d/Box';
import { Button } from 'components/core/ui/button';
import { getColorHex } from 'lib/utils/color';
import { useTheme } from 'lib/utils/hooks/theme';
import { useCallback, useMemo } from 'react';
import Pencil from 'components/svg/Pencil';
import LightBulb from 'components/svg/LightBulb';
import Gear from 'components/svg/Gear';

interface PuzzleHeaderSettingsProps {
  rotatingBoxProps: RotatingBoxProps;
  autocheckEnabled?: boolean;
  draftModeEnabled?: boolean;
  onAutocheckChanged?: (autocheckEnabled: boolean) => void;
  onDraftModeChanged?: (draftModeEnabled: boolean) => void;
  onSettingsPressed?: () => void;
}

const PuzzleHeaderSettings: React.FC<PuzzleHeaderSettingsProps> = ({
  rotatingBoxProps,
  autocheckEnabled,
  draftModeEnabled,
  onAutocheckChanged,
  onDraftModeChanged,
  onSettingsPressed,
}) => {
  const { colors } = useTheme();

  const handleAutocheckChanged = useCallback(() => {
    if (onAutocheckChanged) {
      onAutocheckChanged(!autocheckEnabled);
    }
  }, [autocheckEnabled, onAutocheckChanged]);

  const handleDraftModeChanged = useCallback(() => {
    if (onDraftModeChanged) {
      onDraftModeChanged(!draftModeEnabled);
    }
  }, [draftModeEnabled, onDraftModeChanged]);

  const draftColor = useMemo(() => {
    return draftModeEnabled ? getColorHex(colors.correct) : undefined;
  }, [colors.correct, draftModeEnabled]);

  const correctColor = useMemo(() => {
    return autocheckEnabled ? getColorHex(colors.correct) : undefined;
  }, [autocheckEnabled, colors.correct]);

  return (
    <>
      <Button
        onClick={handleDraftModeChanged}
        variant={draftModeEnabled ? 'outline' : 'ghost'}
        size="icon"
      >
        <Pencil fill={draftColor} width={16} height={16} />
      </Button>
      <Button
        onClick={handleAutocheckChanged}
        variant={autocheckEnabled ? 'outline' : 'ghost'}
        size="icon"
      >
        <LightBulb fill={correctColor} width={16} height={16} />
      </Button>
      <Button onClick={onSettingsPressed} variant="ghost" size="icon">
        <Gear width={16} height={16} />
      </Button>
      <RotatingBox
        side={rotatingBoxProps.side}
        color={rotatingBoxProps.color}
        textColor={rotatingBoxProps.textColor}
      />
    </>
  );
};

export default PuzzleHeaderSettings;
