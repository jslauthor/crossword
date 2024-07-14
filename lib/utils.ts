import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function trimLeadingZeros(hexString: string): string {
  // Check if the input is a valid hex string with 'u' or 'U' prefix and optional underscore delimiters
  if (!/^[uU]([0-9A-Fa-f]+(_[0-9A-Fa-f]+)*)$/.test(hexString)) {
    throw new Error(
      "Invalid hexadecimal string. Must start with 'u' or 'U' followed by hex digits, optionally separated by underscores.",
    );
  }

  // Split the string into prefix and hex part, preserving the original case of 'u' or 'U'
  const [prefix, hexPart] = hexString.split(/(?<=^[uU])/);

  // Split the hex part by underscores
  const hexSegments = hexPart.split('_');

  // Trim leading zeros from each segment, ensuring at least one digit remains
  const trimmedSegments = hexSegments.map(
    (segment) => segment.replace(/^0+(?!$)/, '') || '0',
  );

  // Combine the original prefix with the trimmed hex segments
  return prefix + trimmedSegments.join('_');
}
