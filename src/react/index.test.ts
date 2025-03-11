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

it('test useEffect trigger', () => {
  const triggerOnEach = jest.fn();
  const triggerOnEachNoDep = jest.fn();
  const triggerOnce = jest.fn();

  const counter = () => {
    const [count, setCount] = react.useState(0);

    react.useEffect(triggerOnEach, [count]);
    react.useEffect(triggerOnEachNoDep);
    react.useEffect(triggerOnce, []);

    return w.button([], {
      onClick: () => setCount(count + 1),
    });
  };

  render(w.h(counter));

  const btn = document.querySelector('button')!;

  btn.click();
  expect(triggerOnEach).toBeCalledTimes(2);
  expect(triggerOnEachNoDep).toBeCalledTimes(2);
  expect(triggerOnce).toBeCalledTimes(1);
  btn.click();
  btn.click();
  btn.click();
  expect(triggerOnEach).toBeCalledTimes(5);
  expect(triggerOnEachNoDep).toBeCalledTimes(5);
  expect(triggerOnce).toBeCalledTimes(1);
});

it('test useEffect props', () => {
  const child = (state:{ count:number }) => {
    const [count, setCount] = react.useState(0);

    react.useEffect(() => {
      setCount(state.count);
    }, [state.count]);

    return w.fragment([`Count: ${count}`]);
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
  expect(getByText(document.body, 'Count: 2')).not.toBeNull();
});

it('test useEffect child', () => {
  const fn = jest.fn();
  const child = () => {
    fn('child render');

    return w.fragment([]);
  };

  const parent = () => {
    react.useEffect(() => {
      fn('parent effect');
    }, []);

    return w.h(child);
  };

  render(w.h(parent));

  expect(fn).toHaveBeenNthCalledWith(1, 'child render');
  expect(fn).toHaveBeenNthCalledWith(2, 'parent effect');
});

// it('test useEffect child, async', (done) => {
//   const fn = jest.fn();
//   const child = () => {
//     Promise.resolve().then(() => fn('child render'));
//
//     return w.fragment([]);
//   };
//
//   const parent = () => {
//     react.useEffect(() => {
//       fn('parent effect');
//     }, []);
//
//     return w.h(child);
//   };
//
//   render(w.h(parent));
//
//   setTimeout(() => {
//     expect(fn).toHaveBeenNthCalledWith(1, 'child render');
//     expect(fn).toHaveBeenNthCalledWith(2, 'parent effect');
//     done();
//   });
// });

it('test useEffect clear', () => {
  const fn = jest.fn();

  const Counter = () => {
    const [count, setCount] = react.useState(0);

    react.useEffect(() => fn, [count]);

    return w.button([], {
      onClick: () => setCount(count + 1),
    });
  };

  render(w.h(Counter));

  const btn = document.querySelector('button')!;

  btn.click();
  expect(fn).toHaveBeenCalledTimes(1);
  btn.click();
  expect(fn).toHaveBeenCalledTimes(2);
});

it('test useEffect clear child', () => {
  const fn = jest.fn();

  const child = (state:any) => {
    react.useEffect(() => () => fn('child clear'), [state]);

    return w.fragment([]);
  };

  const Counter = () => {
    const [count, setCount] = react.useState(0);

    react.useEffect(() => () => fn('parent clear'), [count]);

    return w.button([w.h(child, {})], {
      onClick: () => setCount(count + 1),
    });
  };

  render(w.h(Counter));

  const btn = document.querySelector('button')!;

  btn.click();
  expect(fn).toHaveBeenNthCalledWith(1, 'parent clear');
  expect(fn).toHaveBeenNthCalledWith(2, 'child clear');
  btn.click();
  expect(fn).toHaveBeenNthCalledWith(3, 'parent clear');
  expect(fn).toHaveBeenNthCalledWith(4, 'child clear');
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

    x = react.useMemo(() => count, [count]);
    y = react.useMemo(() => count, []);

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
