/**
 * @jest-environment jsdom
 */

import { getByText } from '@testing-library/dom';
import * as h from '.';
import * as web from './target-web';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('test evalText', () => {
  const text = web.evalText({
    tag: 'text',
    text: 'hello world',
  });
  document.body.append(text);

  expect(getByText(document.body, 'hello world')).not.toBeNull();
});

it('test evalDiv', () => {
  const div = web.evalDiv({
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
  });

  expect(div.style.width).toBe('300px');
  expect(getByText(div, 'hello world')).not.toBeNull();
});

it('test evalButton', () => {
  let count = 0;
  const btn = web.evalButton({
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
  });

  expect(btn.style.width).toBe('300px');
  expect(getByText(btn, 'hello world')).not.toBeNull();

  btn.click();
  expect(count).toBe(1);

  btn.click();
  expect(count).toBe(2);
});

it('test evalFragment', () => {
  const elems = web.evalFragment({
    tag: 'fragment',
    children: [],
  });
  document.body.append(...elems);

  expect(document.body.innerHTML).toBe('<!--fragment 0 start--><!--fragment 0 end-->');
});

it('test evalVNode', () => {
  let count = 0;
  const app = web.evalVNode(h.fragment([
    h.div(
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
    h.button(
      ['Click Me'],
      {
        onClick: () => { count += 1; },
      },
    ),
  ]));
  document.body.append(...(app as HTMLElement[]));

  const btn = getByText(document.body, 'Click Me');

  expect(btn).not.toBeNull();

  btn.click();
  expect(count).toBe(1);

  btn.click();
  expect(count).toBe(2);
});
