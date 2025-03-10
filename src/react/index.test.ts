/**
 * @jest-environment jsdom
 */

import { getByText } from '@testing-library/dom';
import react from '.';
import * as w from '../vdom/target-web';

let render: ReturnType<typeof react.createRoot>['render'];
beforeEach(() => {
  document.body.innerHTML = '';
  render = react.createRoot(document.body).render;
});

it('test useState', () => {
  const counter = () => {
    const [count, setCount] = react.useState(0);

    return w.button([`${count}`], {
      onClick: () => setCount(count + 1),
    });
  };

  render(w.h(counter));

  const btn = document.querySelector('button')!;

  expect(getByText(btn, '0')).not.toBeNull();

  btn.click();
  expect(getByText(btn, '1')).not.toBeNull();
  btn.click();
  expect(getByText(btn, '2')).not.toBeNull();
});

it('test useState fn', () => {
  const counter = () => {
    const [count, setCount] = react.useState(0);

    return w.button([`${count}`], {
      onClick: () => setCount((c) => c + 1),
    });
  };

  render(w.h(counter));

  const btn = document.querySelector('button')!;

  expect(getByText(btn, '0')).not.toBeNull();

  btn.click();
  expect(getByText(btn, '1')).not.toBeNull();
  btn.click();
  expect(getByText(btn, '2')).not.toBeNull();
});

it('test useEffect', () => {
  const triggerOnEach = jest.fn();
  const triggerOnEach2 = jest.fn();
  const triggerOnce = jest.fn();

  const counter = () => {
    const [count, setCount] = react.useState(0);

    react.useEffect(triggerOnEach, [count]);
    react.useEffect(triggerOnEach2);
    react.useEffect(triggerOnce, []);

    return w.button([], {
      onClick: () => setCount(count + 1),
    });
  };

  render(w.h(counter));

  const btn = document.querySelector('button')!;

  btn.click();
  expect(triggerOnEach).toBeCalledTimes(2);
  expect(triggerOnEach2).toBeCalledTimes(2);
  expect(triggerOnce).toBeCalledTimes(1);
  btn.click();
  btn.click();
  btn.click();
  expect(triggerOnEach).toBeCalledTimes(5);
  expect(triggerOnEach2).toBeCalledTimes(5);
  expect(triggerOnce).toBeCalledTimes(1);
});

it('test useEffect props', () => {
  const fn = jest.fn();
  const child = (state) => {
    react.useEffect(fn, [state.count]);

    return w.fragment([]);
  };

  const parent = () => {
    const [count, setCount] = react.useState(0);

    return w.fragment(
      [
        w.h(child, { count }),
        w.button([], {
          onClick: () => setCount(count + 1),
        }),
      ],
    );
  };

  render(w.h(parent));

  const btn = document.querySelector('button')!;

  btn.click();
  btn.click();
  expect(fn).toBeCalledTimes(3);
});

it('test useRef', () => {
  const fn = jest.fn();

  const counter = () => {
    const ref = react.useRef(0);

    react.useEffect(fn, [ref]);

    return w.button([], {
      onClick: () => { ref.current += 1; },
    });
  };

  render(w.h(counter));

  const btn = document.querySelector('button')!;

  btn.click();
  btn.click();
  btn.click();
  expect(fn).toBeCalledTimes(1);
});

it('test useMemo', () => {
  let x: number | undefined;
  let y: number | undefined;
  const counter = () => {
    const [count, setCount] = react.useState(0);

    x = react.useMemo(() => { return count; }, [count]);
    y = react.useMemo(() => { return count; }, []);

    return w.button([], {
      onClick: () => setCount(count + 1),
    });
  };

  render(w.h(counter));

  expect(x).toBe(0);
  expect(y).toBe(0);

  const btn = document.querySelector('button')!;

  btn.click();
  btn.click();
  btn.click();
  expect(x).toBe(3);
  expect(y).toBe(0);
});
