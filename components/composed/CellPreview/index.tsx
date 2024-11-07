import { cn } from 'lib/utils';
import { getColorHex } from 'lib/utils/color';
import { useTheme } from 'lib/utils/hooks/theme';
import React, { useMemo } from 'react';
import { CellStyle } from 'types/types';

type CellStyles = CellStyle & {
  showValid?: boolean;
  showDraft?: true;
};

interface CellPreviewProps {
  children?: React.ReactNode;
  className?: string;
  style?: CellStyles;
}

export function CellPreview({ children, className, style }: CellPreviewProps) {
  const {
    colors: { correct: correctColor, error: errorColor },
  } = useTheme();

  const correctColorHex = useMemo(
    () => getColorHex(correctColor),
    [correctColor],
  );
  const errorColorHex = useMemo(() => getColorHex(errorColor), [errorColor]);

  return (
    <div
      className={cn(
        'relative w-5 h-5 border border-solid rounded-lg bg-white border-gray-200 uppercase overflow-hidden',
        'flex items-center justify-center text-black text-sm font-bold shadow-sm',
        className,
      )}
    >
      {style?.showValid === false && (
        <div
          className="absolute w-[3px] h-[200%]"
          style={{
            backgroundColor: errorColorHex,
            transform: 'rotate(45deg)',
            transformOrigin: 'center',
          }}
        />
      )}
      {style?.showValid === true && (
        <div
          className="absolute w-[6px] h-full top-[-50%] right-0"
          style={{
            backgroundColor: correctColorHex,
            transform: 'rotate(-45deg)',
          }}
        />
      )}
      <span className={cn('relative', style?.showDraft ? 'opacity-50' : '')}>
        {children}
      </span>
    </div>
  );
}
