import { format, formatDistanceToNow } from 'date-fns';

// formatDate(date) → "Jan 15, 2024"
export const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

// timeAgo(date) → "2 hours ago"
export const timeAgo = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};