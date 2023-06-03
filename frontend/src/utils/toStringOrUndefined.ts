export function toStringOrUndefined(value: any): string | undefined {
  if (value) {
    return String(value);
  }

  return undefined;
}
