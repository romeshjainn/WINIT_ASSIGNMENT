import { format, parseISO } from 'date-fns';

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function oneYearFromToday(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return format(d, 'yyyy-MM-dd');
}
