import { flattern } from '@/utils';

it('test flatten', () => {
  expect(flattern([])).toEqual([]);
  expect(flattern([1])).toEqual([1]);
  expect(flattern([1, [2, 3]])).toEqual([1, 2, 3]);
  expect(flattern([1, [2, [3]]])).toEqual([1, 2, 3]);
});
