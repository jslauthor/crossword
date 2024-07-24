import { Card, CardContent } from 'components/core/ui/card';
import { ReactNode } from 'react';

export const OutlineCard = ({ children }: { children: ReactNode }) => {
  return (
    <Card className="w-full flex flex-col justify-center items-center p-4 relative rounded-xl overflow-hidden bg-transparent border-solid border border-foreground/20 shadow-none">
      <CardContent className="relative w-full h-full flex flex-col gap-6 justify-center items-center">
        {children}
      </CardContent>
    </Card>
  );
};
