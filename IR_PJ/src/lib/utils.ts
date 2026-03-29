import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDuration = (duration?: string | number) => {
  if (!duration) return '0 mins';
  if (typeof duration === 'number') return `${duration} mins`;
  
  const str = duration.toString();
  if (!str.startsWith('PT')) return `${str} mins`;

  let hours = 0;
  let minutes = 0;

  const hourMatch = str.match(/(\d+)H/);
  const minuteMatch = str.match(/(\d+)M/);

  if (hourMatch) hours = parseInt(hourMatch[1], 10);
  if (minuteMatch) minutes = parseInt(minuteMatch[1], 10);

  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);

  return parts.length > 0 ? parts.join(' ') : '0 mins';
};