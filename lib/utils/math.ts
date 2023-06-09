export function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// This only works for operations that are smaller than the total range
export const rangeOperation = (
  start: number,
  end: number,
  val1: number,
  val2: number,
  operation: '-' | '+'
) => {
  switch (operation) {
    case '+':
      const addVal = val1 + val2;
      if (addVal > end) {
        return start + (addVal - end);
      }
      return addVal;
    case '-':
      const subVal = val1 - val2;
      if (subVal < 0) {
        return end + (subVal + 1);
      }
      return subVal;
    default:
      return 0;
  }
};

export const radToDeg = (radians: number) => radians * (180 / Math.PI);
