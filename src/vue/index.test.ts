/**
 * @jest-environment jsdom
 */

import { getByText } from '@testing-library/dom';
import vue from '.';
import react from '@/react';
import * as w from '../vdom/target-web';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('test ref', () => {
  const counter = {
    setup() {
      const ref = vue.ref(0);
      const onClick = () => { ref.value += 1; };

      return () => w.button([`${ref.value}`], { onClick });
    },
  };

  vue.createApp(w.h(counter)).mount(document.body);

  const btn = document.querySelector('button')!;

  expect(getByText(btn, '0')).not.toBeNull();

  btn.click();
  expect(getByText(btn, '1')).not.toBeNull();
  btn.click();
  expect(getByText(btn, '2')).not.toBeNull();
});

it('test watch', () => {
  const fn = jest.fn();
  const counter = {
    setup() {
      const ref = vue.ref(0);

      const unwatch = vue.watch(ref, fn);
      const onClick = () => {
        ref.value += 1;
        if (ref.value >= 3) unwatch();
      };

      return () => w.button([`${ref.value}`], { onClick });
    },
  };

  vue.createApp(w.h(counter)).mount(document.body);

  const btn = document.querySelector('button')!;

  btn.click();
  expect(fn).toHaveBeenCalledTimes(1);
  btn.click();
  btn.click();
  btn.click();
  btn.click();

  expect(fn).toHaveBeenCalledTimes(3);
});

it('test crazy', () => {
  const fn = jest.fn();
  const counter = {
    setup() {
      const ref = vue.ref(0);

      vue.watch(ref, (n) => console.log(`Outside: ${n}`));

      return () => {
        const [count, setCount] = react.useState(ref.value);

        react.useEffect(() => fn([ref.value, count]), [count]);

        return w.fragment([
          w.div([`${ref.value}`, `${count}`]),
          w.button(['Outside'], { onClick: () => { ref.value += 1; } }),
          w.button(['Inside'], { onClick: () => setCount(count + 1) }),
        ]);
      };
    },
  };

  vue.createApp(w.h(counter)).mount(document.body);

  expect(fn).toHaveBeenCalledWith([0, 0]);

  const btnOutside = getByText(document.body, 'Outside');
  const btnInside = getByText(document.body, 'Inside');

  btnOutside.click();
  btnOutside.click();
  btnOutside.click();
  btnInside.click();
  expect(fn).toHaveBeenCalledWith([3, 1]);

  fn.mockClear();
  btnInside.click();
  expect(fn).toHaveBeenCalledWith([3, 2]);
});
