import * as React from 'react';

import { cn } from 'lib/utils';
import { LucideIcon } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: LucideIcon;
  endIcon?: LucideIcon;
  onEndIconClick?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startIcon, endIcon, onEndIconClick, ...props }, ref) => {
    const StartIcon = startIcon;
    const EndIcon = endIcon;

    return (
      <div className="w-full relative">
        {StartIcon && (
          <div className="absolute left-1.5 top-1/2 transform -translate-y-1/2">
            <StartIcon className="text-muted-foreground" />
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            startIcon ? 'pl-12' : '',
            endIcon ? 'pr-12' : '',
            className,
          )}
          ref={ref}
          {...props}
        />
        {EndIcon && (
          <div
            className="absolute right-3 top-0 bottom-0 flex items-center justify-center"
            onClick={onEndIconClick}
          >
            <EndIcon className="text-muted-foreground" />
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
