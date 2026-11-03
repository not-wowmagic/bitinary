export function cn(...parts: Array<string | number | false | null | undefined>) {
  return parts.filter((p) => typeof p === 'string' && p).join(' ')
}
