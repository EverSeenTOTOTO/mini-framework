export const flattern = (arr: unknown[]): unknown[] => {
  return arr.reduce((p: unknown[], c) => [...p, ...Array.isArray(c) ? flattern(c) : [c]], []);
};
