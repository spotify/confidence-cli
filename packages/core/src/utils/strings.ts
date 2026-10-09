export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function conjoin(items: string[], conjunction = 'and'): string {
  if (items.length <= 2) return items.join(` ${conjunction} `);
  return items.slice(0, -1).join(', ') + `, ${conjunction} ` + items.at(-1);
}
