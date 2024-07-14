import { getPuzzleProgressesForUser } from 'app/actions';
import { ProgressEnum } from 'components/svg/PreviewCube';
import { useEffect, useMemo, useState } from 'react';

export const usePreviewState = (slugs: string[], userId?: string) => {
  const defaultValue = useMemo(
    () =>
      slugs.reduce(
        (acc, id) => {
          acc[id] = ProgressEnum.ZeroPercent;
          return acc;
        },
        {} as Record<string, ProgressEnum>,
      ),
    [slugs],
  );

  const [previewState, setPreviewState] = useState(defaultValue);

  useEffect(() => {
    if (userId != null) {
      const getPreviewState = async () => {
        const state = await getPuzzleProgressesForUser(userId, slugs);
        console.log(state);
        setPreviewState(state);
      };
      getPreviewState();
    }
  }, [defaultValue, slugs, userId]);

  return previewState;
};
