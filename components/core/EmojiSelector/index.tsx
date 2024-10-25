'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  forwardRef,
  ReactNode,
} from 'react';
import useEmojiDatabase, { CATEGORIES } from 'lib/utils/hooks/useEmojiDatabase';
import { Input } from 'components/core/ui/input';
import { Card, CardHeader } from 'components/core/ui/card';
import { Button } from 'components/core/ui/button';
import { emojiToUnicode } from 'lib/utils/puzzle';
import Image from 'next/image';
import { SVG_BASE_PATH } from 'lib/utils/hooks/useSvgAtlas';
import { HRule } from '../Dividers';
import styled from 'styled-components';
import { cn } from 'lib/utils';

const Underline = styled.div`
  background-color: hsl(var(--primary));
  height: 0.25rem;
  width: 100%;
`;

type CategoryListType = {
  onSelectGroup: (group: number) => void;
  selectedGroup: number;
};

const CategoryList: React.FC<CategoryListType> = ({
  onSelectGroup,
  selectedGroup,
}) => {
  const items = useMemo(() => {
    return CATEGORIES.map((category) => {
      const imgPath = `${SVG_BASE_PATH}${category.unicode}.svg`;
      return (
        <div
          key={category.label}
          className="flex flex-col gap-0 justify-center items-center"
        >
          <Button
            className="flex justify-center items-center h-[50px] w-[50px] p-0 m-0"
            onClick={() => onSelectGroup(category.group)}
            variant="ghost"
          >
            <Image
              alt={category.label ?? 'Emoji'}
              width={30}
              height={30}
              src={imgPath}
              unoptimized
              priority
            />
          </Button>
          {selectedGroup === category.group && <Underline />}
        </div>
      );
    });
  }, [onSelectGroup, selectedGroup]);
  return (
    <div className="flex flex-row justify-between items-center w-full">
      {items}
    </div>
  );
};

const GridList = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GridList({ style, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      {...props}
      className="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2 w-full relative overflow-y-auto"
      style={{ ...style }}
    >
      {children}
    </div>
  );
});

interface EmojiSelectorProps {
  onEmojiSelect?: (emoji: string) => void;
  className?: string;
}

export function EmojiSelector({
  onEmojiSelect,
  className,
}: EmojiSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [group, setGroup] = useState<number>(0);
  const { queryResult } = useEmojiDatabase(searchQuery, group);

  const emojis: string[] = useMemo(() => {
    return queryResult.map((emoji) => emojiToUnicode(emoji.unicode));
  }, [queryResult]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
    },
    [],
  );

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onEmojiSelect?.(emoji);
    },
    [onEmojiSelect],
  );

  const onSelectGroup = useCallback((group: number) => setGroup(group), []);

  const EmojiList: ReactNode = useMemo(
    () => (
      <GridList>
        {emojis.map((emoji, index) => {
          const handleClick = () => handleEmojiClick(emoji);
          const path = `${SVG_BASE_PATH}${emoji}.svg`;
          return (
            <Button
              key={emoji}
              onClick={handleClick}
              className="h-[50px] w-[50px] p-0 m-0"
              variant="ghost"
            >
              <Image
                alt={queryResult[index].name ?? 'Emoji'}
                width={30}
                height={30}
                src={path}
                unoptimized
              />
            </Button>
          );
        })}
      </GridList>
    ),
    [emojis, handleEmojiClick, queryResult],
  );

  return (
    <Card className={cn('relative w-full p-0 flex flex-col gap-0', className)}>
      <CardHeader className="relative w-full p-4 pb-0">
        <Input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search emojis..."
          className="mb-4"
        />
      </CardHeader>
      <CategoryList onSelectGroup={onSelectGroup} selectedGroup={group} />
      <HRule className="mb-2" />
      {EmojiList}
    </Card>
  );
}

export default EmojiSelector;
