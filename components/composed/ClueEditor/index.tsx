import React, { useCallback, useState } from 'react';
import { PuzzleType, Clue, SolutionCell } from 'types/types';
import { CellPreview } from 'components/composed/CellPreview';
import { Input } from 'components/core/ui/input';
import { CharacterRecord, isSolutionCellValue } from 'lib/utils/puzzle';
import { SVG_BASE_PATH } from 'lib/utils/hooks/useSvgAtlas';
import { SettingsTitle } from '../PuzzleSettings';
import { HRule } from 'components/core/Dividers';

interface ClueEditorProps {
  puzzle: PuzzleType;
  onUpdateClue?: (
    direction: keyof CharacterRecord['clues'],
    index: number,
    newClue: string,
  ) => void;
}

export function ClueEditor({ puzzle, onUpdateClue }: ClueEditorProps) {
  const [acrossClues, setAcrossClues] = useState(puzzle.record.clues.across);
  const [downClues, setDownClues] = useState(puzzle.record.clues.down);

  const getWordSequence = useCallback(
    (clue: Clue, direction: keyof CharacterRecord['clues']) => {
      for (let i = 0; i < puzzle.record.solution.length; i++) {
        const { value, mapping } = puzzle.record.solution[i];
        if (value !== '#' && value.cell === clue.number && mapping != null) {
          // On this case we always want the last mapping
          // since that will always be the final answer for that cell
          const values = Object.entries(mapping)
            .sort(([key]) => parseInt(key)) // Sort by the clue number
            .map(([_, value]) => value); // Get the values
          const sequenceIndex =
            values[values.length - 1][
              direction === 'across'
                ? 'acrossSequenceIndex'
                : 'downSequenceIndex'
            ];
          if (sequenceIndex != null) {
            return puzzle.record.wordSequences[sequenceIndex];
          }
        }
      }
      return [];
    },
    [puzzle],
  );

  const handleClueChange = useCallback(
    (direction: 'across' | 'down', index: number, newClue: string) => {
      if (direction === 'across') {
        const updatedClues = [...acrossClues];
        updatedClues[index].clue = newClue;
        setAcrossClues(updatedClues);
      } else {
        const updatedClues = [...downClues];
        updatedClues[index].clue = newClue;
        setDownClues(updatedClues);
      }
      onUpdateClue?.(direction, index, newClue);
    },
    [acrossClues, downClues, onUpdateClue],
  );

  const renderClues = useCallback(
    (clues: Clue[], direction: keyof CharacterRecord['clues']) => (
      <div className="flex flex-col gap-4 relative h-auto w-full">
        <div className="sticky top-0 bg-background z-10 pt-4 flex flex-col gap-4">
          <SettingsTitle>
            {direction.charAt(0).toUpperCase() + direction.slice(1)} Clues
          </SettingsTitle>
          <HRule />
        </div>
        {clues.map((clue, index) => {
          const wordSequence = getWordSequence(clue, direction);
          return (
            <div key={index} className="flex flex-row gap-2 items-center">
              <div className="text-md font-bold text-center min-w-8">
                {clue.number}
              </div>
              <div className="flex flex-col gap-1 flex-1 pr-4">
                <Input
                  type="text"
                  value={clue.clue}
                  placeholder="Enter clue here..."
                  onChange={(e) =>
                    handleClueChange(direction, index, e.target.value)
                  }
                  // TODO: On mouse over show the pencil icon
                  className="w-full text-[16px] h-auto p-0 m-0"
                />
                <div className="flex flex-row gap-1">
                  {wordSequence.map((index) => {
                    const cell = puzzle.record.solution[index].value;
                    if (isSolutionCellValue(cell)) {
                      if (cell.value.length > 1) {
                        const url =
                          SVG_BASE_PATH + cell.value.toLowerCase() + '.svg';
                        return (
                          <CellPreview key={index}>
                            <img
                              alt={cell.value}
                              width={30}
                              height={30}
                              src={url}
                              loading="eager"
                            />
                          </CellPreview>
                        );
                      } else {
                        return (
                          <CellPreview key={index}>{cell.value}</CellPreview>
                        );
                      }
                    }
                    return <CellPreview key={index}> </CellPreview>;
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <HRule />
      </div>
    ),
    [handleClueChange],
  );

  return (
    <div className="relative h-full w-full overflow-y-auto flex flex-col gap-4">
      {acrossClues.length > 0 && renderClues(acrossClues, 'across')}
      {downClues.length > 0 && renderClues(downClues, 'down')}
    </div>
  );
}
