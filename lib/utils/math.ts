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
  }
);

export const radToDeg = (radians: number) => radians * (180 / Math.PI);
