export function assertValues<T>(
  values: T | Array<T | undefined> | undefined,
  errorMessage: string,
): T {
  if (Array.isArray(values)) {
    for (const value of values) {
      if (typeof value !== "undefined") {
        return value;
      }
    }
  } else if (typeof values !== "undefined") {
    return values;
  }

  throw new Error(errorMessage);
}
