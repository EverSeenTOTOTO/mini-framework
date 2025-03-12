export const flatten = (arr: unknown[]): unknown[] => {
  return arr.reduce((p: unknown[], c) => [...p, ...Array.isArray(c) ? flatten(c) : [c]], []);
};

export const diffObject = <O extends Record<string, unknown>>(source: O, target: O, callback: (p: string, newValue: unknown, oldValue: unknown) => void) => {
  const sourceProps = Object.keys(source);
  const targetProps = Object.keys(target);

  for (const prop of sourceProps) {
    if (targetProps.includes(prop)) {
      if (target[prop] !== source[prop]) { // change
        callback(prop, target[prop], source[prop]);
      }
    } else { // delete
      callback(prop, null, null);
    }
  }

  for (const prop of targetProps) {
    if (!sourceProps.includes(prop)) { // append
      callback(prop, target[prop], null);
    }
  }
};

/* 最小编辑操作序列 */

// 限定一步Edit的代价为1，通过统计不同序列的长度来比对代价大小
type EditionInternal<T> = {
  source?: T,
  target?: T,
  action: 'delete' | 'insert' | 'keep',
};
export type Edition<T> = (EditionInternal<T> & { index: number });

const formatIndex = <T>(es: EditionInternal<T>[]): Edition<T>[] => {
  let index = 0;

  return es.map((e) => {
    const r = { ...e, index };

    switch (e.action) {
      case 'keep':
      case 'insert':
        index += 1;
        break;
      case 'delete':
      default:
        break;
    }

    return r;
  });
};

// inefficient
export const minimalEditSequence = <T>(source: T[], target: T[], compare = (a: T, b: T) => a === b): Edition<T>[] => {
  if (source.length === 0) {
    return formatIndex(target.map((value) => ({ target: value, action: 'insert' })));
  } if (target.length === 0) {
    return formatIndex(source.map((value) => ({ source: value, action: 'delete' })));
  }

  const sourceFirst = source[0];
  const targetFirst = target[0];

  if (compare(sourceFirst, targetFirst)) { // same
    return formatIndex([
      { source: sourceFirst, target: targetFirst, action: 'keep' },
      ...minimalEditSequence(source.slice(1), target.slice(1), compare),
    ]);
  }

  const e1: EditionInternal<T>[] = [
    { source: sourceFirst, action: 'delete' },
    ...minimalEditSequence(source.slice(1), target, compare),
  ];
  const e2: EditionInternal<T>[] = [
    { target: targetFirst, action: 'insert' },
    ...minimalEditSequence(source, target.slice(1), compare),
  ];

  return formatIndex(e1.length < e2.length ? e1 : e2);
};

export class PriorHeap<T> {
  heap: T[];

  comparar:(a:T, b:T) => boolean ;

  constructor(init:T[] = [], comparar: PriorHeap<T>['comparar'] = ((a, b) => a < b)) {
    this.heap = init;
    this.comparar = comparar;
  }

  static parent(i:number) {
    if (i === 1) return 0;
    return Math.ceil((i - 2) / 2);
  }

  static leftChild(i:number) {
    return 2 * i + 1;
  }

  static rightChild(i:number) {
    return 2 * i + 2;
  }

  protected bubble(i: number) {
    while (true) {
      const parentIndex = PriorHeap.parent(i);

      if (i <= 0 || this.comparar(this.heap[parentIndex], this.heap[i])) break;

      const temp = this.heap[parentIndex];
      this.heap[parentIndex] = this.heap[i];
      this.heap[i] = temp;
      // eslint-disable-next-line no-param-reassign
      i = parentIndex;
    }
  }

  protected sink(i:number) {
    let smallerIndex = i;
    const leftIndex = PriorHeap.leftChild(i);
    const rightIndex = PriorHeap.rightChild(i);

    if (leftIndex < this.heap.length && this.comparar(this.heap[leftIndex], this.heap[smallerIndex])) {
      smallerIndex = leftIndex;
    }
    if (rightIndex < this.heap.length && this.comparar(this.heap[rightIndex], this.heap[smallerIndex])) {
      smallerIndex = rightIndex;
    }

    if (smallerIndex !== i) {
      const temp = this.heap[smallerIndex];
      this.heap[smallerIndex] = this.heap[i];
      this.heap[i] = temp;

      this.sink(smallerIndex);
    }
  }

  push(item: T) {
    this.heap.push(item);
    this.bubble(this.heap.length - 1);
  }

  pop() {
    const top = this.heap.shift();

    if (this.heap.length > 0) {
      this.sink(0);
    }

    return top;
  }

  top() {
    return this.heap[0];
  }

  get length() {
    return this.heap.length;
  }

  clear() {
    this.heap = [];
  }
}
