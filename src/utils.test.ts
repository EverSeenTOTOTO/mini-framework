import { Edition, flatten, minimalEditSequence, PriorHeap } from '@/utils';

it('test flatten', () => {
  expect(flatten([])).toEqual([]);
  expect(flatten([1])).toEqual([1]);
  expect(flatten([1, [2, 3]])).toEqual([1, 2, 3]);
  expect(flatten([1, [2, [3]]])).toEqual([1, 2, 3]);
});

it('test editSequence', () => {
  expect(minimalEditSequence([], [])).toEqual([]);
  expect(minimalEditSequence([1], [1])).toEqual([
    { source: 1, target: 1, action: 'keep', index: 0 },
  ]);
  expect(minimalEditSequence([1], [])).toEqual([
    { source: 1, action: 'delete', index: 0 },
  ]);
  expect(minimalEditSequence([], [1])).toEqual([
    { target: 1, action: 'insert', index: 0 },
  ]);
  expect(minimalEditSequence([1], [2])).toEqual([
    { target: 2, action: 'insert', index: 0 },
    { source: 1, action: 'delete', index: 1 },
  ]);
  expect(minimalEditSequence([1], [2, 1])).toEqual([
    { target: 2, action: 'insert', index: 0 },
    { source: 1, target: 1, action: 'keep', index: 1 },
  ]);
  expect(minimalEditSequence([2, 1], [1])).toEqual([
    { source: 2, action: 'delete', index: 0 },
    { source: 1, target: 1, action: 'keep', index: 0 },
  ]);

  const edit = <T>(edition: Edition<T>, source: T[]) => {
    switch (edition.action) {
      case 'insert':
        source.splice(edition.index, 0, edition.target!);
        break;
      case 'delete':
        source.splice(edition.index, 1);
        break;
      case 'keep':
      default:
        break;
    }
  };
  const testSeq = <T>(source: T[], target: T[]) => {
    const seq = minimalEditSequence<T>(source, target);

    seq.forEach((e) => edit(e, source));

    expect(source).toEqual(target);
  };

  testSeq([1, 2, 3, 4], [4, 3, 2, 1]);
  testSeq([1, 2, 3, 4], [2, 2, 2, 2]);
  testSeq([1, 2, 3, 4], [0, 0, 0, 0]);
  testSeq([1, 2, 3, 4], []);
  testSeq([], [1, 2, 3, 4]);
});

it('test PriorHeap', () => {
  const heap = new PriorHeap([
    1, 2, 3, 4, 5,
  ]);

  expect(heap.top()).toBe(1);
  expect(heap.length).toBe(5);

  expect(heap.pop()).toBe(1);
  expect(heap.length).toBe(4);
  expect(heap.pop()).toBe(2);
  expect(heap.top()).toBe(3);

  heap.push(2);
  expect(heap.top()).toBe(2);
  heap.push(1);
  expect(heap.top()).toBe(1);
});

it('test PriorHeap comparar', () => {
  const heap = new PriorHeap([
    'a', 'ab', 'abc', 'abcd', 'abcde',
  ], (a, b) => a.length < b.length);

  expect(heap.top()).toBe('a');
  expect(heap.length).toBe(5);

  expect(heap.pop()).toBe('a');
  expect(heap.pop()).toBe('ab');
  expect(heap.top()).toBe('abc');

  heap.push('a');
  expect(heap.top()).toBe('a');
  heap.push('ab');
  expect(heap.top()).toBe('a');
});
