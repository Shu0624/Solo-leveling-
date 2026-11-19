import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** One-line summary of a POST /discover/refresh result; `noun` is 'programs' or 'benefits'. */
export function describeRefresh(result = {}, noun) {
  const expired = result.expired ? ` Removed ${result.expired} expired listing${result.expired === 1 ? '' : 's'}.` : '';
  if (result.failed) return `Couldn't reach the web search just now.${expired} Try again in a minute.`;
  if (result.cooldown) return `Already checked for new ${noun} in the last 30 minutes.${expired}`;
  if (!result.searched) return expired.trim() || 'Up to date.';
  const found = result[noun] || 0;
  return `${found ? `Found ${found} new ${noun}` : `No new ${noun} found`} on the web.${expired}`;
}
