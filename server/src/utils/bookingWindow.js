export const BOOK_AHEAD_DAYS = 7;           // configurable
export const CLOSE_BEFORE_MINUTES = 60;     // configurable
const MS = 60 * 1000;

export function windowFor(start, now = new Date()) {
  const openAt  = new Date(start.getTime() - BOOK_AHEAD_DAYS * 24 * 60 * MS);
  const closeAt = new Date(start.getTime() - CLOSE_BEFORE_MINUTES * MS);
  const bookable = now >= openAt && now <= closeAt;
  return { openAt, closeAt, bookable };
}
