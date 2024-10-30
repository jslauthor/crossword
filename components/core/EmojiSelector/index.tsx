'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useEffect,
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
import { NativeEmoji } from 'emoji-picker-element/shared';
import { VirtuosoGrid } from 'react-virtuoso';
import useEmojiCache from 'lib/utils/hooks/useEmojiCache';
import useDimensions from 'react-cool-dimensions';
import { CircleX } from 'lucide-react';

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

const gridComponents = {
  List: forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ style, children, ...props }, ref) => (
      <div
        ref={ref}
        {...props}
        className="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2 w-full relative"
        style={{ ...style }}
      >
        {children}
      </div>
    ),
  ),
  Item: forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ children, ...props }, ref) => (
      <div ref={ref} {...props} className="flex items-center justify-center">
        {children}
      </div>
    ),
  ),
};

const GridItem: React.FC<{
  emoji: string;
  name: string;
  onClick: () => void;
}> = ({ emoji, name, onClick }) => {
  const { cachedEmoji, isLoading } = useEmojiCache(emoji);
  const disabled = useMemo(() => {
    return cachedEmoji == null || isLoading === true;
  }, [cachedEmoji, isLoading]);
  return (
    <Button
      onClick={onClick}
      className="h-[50px] w-[50px] p-0 m-0"
      variant="ghost"
      disabled={disabled}
    >
      {!disabled && (
        <img
          alt={name ?? 'Emoji'}
          width={30}
          height={30}
          src={cachedEmoji ?? ''}
        />
      )}
    </Button>
  );
};

const EmojiList: React.FC<{
  emojis: string[];
  handleEmojiClick: (emoji: string) => void;
  queryResult: NativeEmoji[];
  height: number;
}> = ({ emojis, handleEmojiClick, queryResult, height }) => {
  const itemContent = useCallback(
    (index: number) => {
      const emoji = emojis[index];
      return (
        <GridItem
          emoji={emoji}
          name={queryResult[index].name ?? 'Emoji'}
          onClick={() => handleEmojiClick(emoji)}
        />
      );
    },
    [emojis, handleEmojiClick, queryResult],
  );

  return (
    <VirtuosoGrid
      style={{ height }}
      totalCount={emojis.length}
      components={gridComponents}
      itemContent={itemContent}
    />
  );
};

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
  const { queryResult, emojiGroups } = useEmojiDatabase(searchQuery);

  const [currentEmojis, setCurrentEmojis] = useState<string[]>([]);
  const [currentGroupEmojis, setCurrentGroupEmojis] = useState<NativeEmoji[]>(
    [],
  );

  const { observe: containerRef, height: emojiListHeight } = useDimensions();

  useEffect(() => {
    if (searchQuery.length > 0) {
      setCurrentEmojis(
        queryResult.map((emoji) => emojiToUnicode(emoji.unicode)),
      );
      setCurrentGroupEmojis(queryResult);
    } else {
      const currentGroupEmojis = emojiGroups[group] || [];
      setCurrentEmojis(
        currentGroupEmojis.map((emoji) => emojiToUnicode(emoji.unicode)),
      );
      setCurrentGroupEmojis(currentGroupEmojis);
    }
  }, [queryResult, group, searchQuery, emojiGroups]);

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

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const onSelectGroup = useCallback(
    (group: number) => {
      setGroup(group);
      clearSearch();
    },
    [group, clearSearch],
  );

  return (
    <Card className={cn('relative w-full p-0 flex flex-col gap-0', className)}>
      <CardHeader className="relative w-full p-4 pb-0 mb-4">
        <Input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search emojis..."
          endIcon={searchQuery.length > 0 ? CircleX : undefined}
          onEndIconClick={clearSearch}
        />
      </CardHeader>
      <CategoryList onSelectGroup={onSelectGroup} selectedGroup={group} />
      <HRule className="mb-2" />
      <div className="h-full w-full" ref={containerRef}>
        <EmojiList
          height={emojiListHeight}
          emojis={currentEmojis}
          handleEmojiClick={handleEmojiClick}
          queryResult={currentGroupEmojis}
        />
      </div>
    </Card>
  );
}

export default EmojiSelector;
