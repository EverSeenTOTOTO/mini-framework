/**
 * @jest-environment jsdom
 */

import { getByText } from '@testing-library/dom';
import * as w from './target-web';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('test evalText', () => {
  w.evalText({
    tag: 'text',
    text: 'hello world',
  }, (output) => {
    document.body.append(...output);

    expect(getByText(document.body, 'hello world')).not.toBeNull();
  });
});

it('test evalDiv', () => {
  w.evalDiv({
    tag: 'div',
    children: [
      {
        tag: 'text',
        text: 'hello world',
      },
    ],
    attr: {
      style: {
        width: 300,
      },
    },
  }, (output) => {
    const div = output[0] as HTMLDivElement;
    expect(div.style.width).toBe('300px');
    expect(getByText(div, 'hello world')).not.toBeNull();
  });
});

it('test evalButton', () => {
  let count = 0;
  w.evalButton({
    tag: 'button',
    children: [
      {
        tag: 'text',
        text: 'hello world',
      },
    ],
    attr: {
      style: {
        width: 300,
      },
      onClick: () => { count += 1; },
    },
  }, (output) => {
    const btn = output[0] as HTMLButtonElement;

    expect(btn.style.width).toBe('300px');
    expect(getByText(btn, 'hello world')).not.toBeNull();

    btn.click();
    expect(count).toBe(1);

    btn.click();
    expect(count).toBe(2);
  });
});

it('test evalFragment', () => {
  w.evalFragment(w.fragment([]), (output) => {
    document.body.append(...output);

    expect(document.body.innerHTML).toBe('<!--fragment 0 start--><!--fragment 0 end-->');
  });
});

it('test evalComponent', () => {
  w.evalComponent(w.h(() => w.div([
    w.h(() => w.fragment(['hello world'])),
  ])), (output) => {
    document.body.append(...output);

    expect(getByText(document.body, 'hello world')).not.toBeNull();
  });
});

it('test evalComponent vue', () => {
  w.evalComponent(w.h({
    setup() {
      return () => w.h({
        setup() {
          return () => w.fragment(['hello world']);
        },
      });
    },
  }), (output) => {
    document.body.append(...output);

    expect(getByText(document.body, 'hello world')).not.toBeNull();
  });
});

it('test evalVNode', () => {
  let count = 0;
  w.evalVNode(w.fragment([
    w.div(
      ['Hello World'],
      {
        style: {
          width: 300,
          height: 50,
          color: 'blue',
          bgColor: '#e4e4e4',
        },
      },
    ),
    w.button(
      ['Click Me'],
      {
        onClick: () => { count += 1; },
      },
    ),
  ]), (output) => {
    document.body.append(...output);

    const btn = getByText(document.body, 'Click Me');

    expect(btn).not.toBeNull();

    btn.click();
    expect(count).toBe(1);

    btn.click();
    expect(count).toBe(2);
  });
});
