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

it('test useState nested', () => {
  const inner = (init: unknown) => {
    const [count, setCount] = react.useState(init as number);

    react.useEffect(() => console.log(init), [init]);

    return w.fragment([
      w.div([`${count}`]),
      w.button(['Inner'], {
        onClick: () => setCount(count + 1),
      })]);
  };
  const outer = () => {
    const [count, setCount] = react.useState(0);

    return w.fragment([
      w.h(inner, count),
      w.button(['Outer'], {
        onClick: () => setCount(count + 1),
      })]);
  };

  render(w.h(outer));

  const btnInside = getByText(document.body, 'Inner');
  const btnOutside = getByText(document.body, 'Outer');

  btnOutside.click();
  btnOutside.click();
  btnOutside.click();
  expect(getByText(document.body, '0')).not.toBeNull();
  btnInside.click();
  expect(getByText(document.body, '1')).not.toBeNull();
  btnInside.click();
  expect(getByText(document.body, '2')).not.toBeNull();
});

it('test useEffect', () => {
  const triggerOnEach = jest.fn();
  const triggerOnce = jest.fn();

  const counter = () => {
    const [count, setCount] = react.useState(0);

    react.useEffect(triggerOnEach, [count]);
    react.useEffect(triggerOnce, []);

    return w.button([], {
      onClick: () => setCount(count + 1),
    });
  };

  render(w.h(counter));

  const btn = document.querySelector('button')!;

  btn.click();
  expect(triggerOnEach).toBeCalledTimes(2);
  expect(triggerOnce).toBeCalledTimes(1);
  btn.click();
  btn.click();
  btn.click();
  expect(triggerOnEach).toBeCalledTimes(5);
  expect(triggerOnce).toBeCalledTimes(1);
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
