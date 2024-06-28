export const formatDate = (date: string) => {
  const dateObj = new Date(date);
  const month = dateObj.toLocaleString('default', { month: 'long' });
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  return `${month} ${day}, ${year}`;
};

export function formatTime(elapsedTime: number | null): string {
  const seconds = Math.floor((elapsedTime ?? 0) % 60);
  const minutes = Math.floor(((elapsedTime ?? 0) / 60) % 60);
  const hours = Math.floor((elapsedTime ?? 0) / 3600);

  const padZero = (num: number): string => num.toString().padStart(2, '0');

  if (hours > 0) {
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
  } else {
    return `${padZero(minutes)}:${padZero(seconds)}`;
  }
}
