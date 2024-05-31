import memoizeOne from 'memoize-one';

export function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const rangeOperation = memoizeOne(
  (start: number, end: number, val1: number, val2: number) => {
    const rangeSize = end - start + 1;
    const result = val1 + val2;
    return ((((result - start) % rangeSize) + rangeSize) % rangeSize) + start;
  },
);

// This will take a range of numbers and return a number that is within that range
export function constrain(start: number, end: number, num: number): number {
  // Calculate the range length
  const rangeLength = end - start + 1;

  // Normalize the number to the range
  let normalizedNum =
    ((((num - start) % rangeLength) + rangeLength) % rangeLength) + start;

  return normalizedNum;
}

export const radToDeg = (radians: number) => radians * (180 / Math.PI);
