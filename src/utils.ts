export const flattern = (arr: unknown[]): unknown[] => {
  return arr.reduce((p: unknown[], c) => [...p, ...Array.isArray(c) ? flattern(c) : [c]], []);
};

export const diffObject = <O extends Record<string, unknown>>(source: O, target: O, callback: (p: string, newValue: unknown, oldValue: unknown) => void) => {
  const sourceProps = Object.keys(source);
  const targetProps = Object.keys(target);

  for (const prop of sourceProps) {
    if (targetProps.includes(prop)) {
      if (target[prop] !== source[prop]) {
        callback(prop, target[prop], source[prop]);
      }
    } else {
      callback(prop, null, null);
    }
  }

  for (const prop of targetProps) {
    if (!sourceProps.includes(prop)) {
      callback(prop, target[prop], null);
    }
  }
};
