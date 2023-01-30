/**
 * @jest-environment jsdom
 */

import { getByText } from '@testing-library/dom';
import * as h from './target-web';
import * as web from './diff-patch-web';

let i = 0;
const increment = () => { i += 1; };
const decrement = () => { i -= 1; };

beforeEach(() => {
  i = 0;
  document.body.innerHTML = '';
});

it('test doInsert', () => {
  const div = document.createElement('div');

  expect(() => web.doInsert({
    type: 'insert',
    index: -1,
    target: document.body,
    value: [div],
  })).toThrow();

  expect(() => web.doInsert({
    type: 'insert',
    index: 1,
    target: document.body,
    value: [div],
  })).toThrow();

  web.doInsert({
    type: 'insert',
    index: 0,
    target: document.body,
    value: [div],
  });

  expect(document.querySelectorAll('div').length).toBe(1);
  expect(document.querySelector('body > div')).toBe(div);

  web.doInsert({
    type: 'insert',
    index: 0,
    target: document.body,
    value: [document.createElement('div'), document.createElement('div')],
  });

  expect(document.querySelectorAll('div').length).toBe(3);
  expect(document.querySelector('body > div:last-child')).toBe(div);
});

it('test doDelete', () => {
  const div = document.createElement('div');

  web.doInsert({
    type: 'insert',
    index: 0,
    target: document.body,
    value: [div],
  });

  expect(document.querySelectorAll('div').length).toBe(1);

  web.doDelete({
    type: 'delete',
    target: [div],
  });

  expect(document.querySelectorAll('div').length).toBe(0);
});

it('test doChange text', () => {
  const text = document.createTextNode('hello');

  web.doInsert({
    type: 'insert',
    index: 0,
    target: document.body,
    value: [text],
  });

  expect(getByText(document.body, 'hello')).toBe(document.body);

  web.doChange({
    type: 'change',
    detail: 'text',
    value: 'world',
    target: text,
  });

  expect(() => getByText(document.body, 'hello')).toThrow();
  expect(getByText(document.body, 'world')).toBe(document.body);
});

it('test doChange style', () => {
  const div = document.createElement('div');

  div.style.width = '400px';
  div.style.color = 'blue';

  web.doInsert({
    type: 'insert',
    index: 0,
    target: document.body,
    value: [div],
  });

  expect(div.style.getPropertyValue('width')).toBe('400px');
  expect(div.style.getPropertyValue('height')).toBe('');
  expect(div.style.getPropertyValue('color')).toBe('blue');

  web.doChange({
    type: 'change',
    detail: 'style',
    value: {
      width: '300px',
      height: '200px',
      color: undefined,
    },
    target: div,
  });

  expect(div.style.getPropertyValue('width')).toBe('300px');
  expect(div.style.getPropertyValue('height')).toBe('200px');
  expect(div.style.getPropertyValue('color')).toBe('');
});

it('test doChange event', () => {
  const button = document.createElement('button');

  button.click();
  expect(i).toBe(0);

  web.doChange({
    type: 'change',
    detail: 'event',
    value: {
      onClick: [undefined, increment],
    },
    target: button,
  });
  web.doChange({
    type: 'change',
    detail: 'event',
    value: {
      onClick: [undefined, () => { i += 1; }], // add another increment
    },
    target: button,
  });

  button.click();
  expect(i).toBe(2);

  web.doChange({
    type: 'change',
    detail: 'event',
    value: {
      onClick: [increment, decrement],
    },
    target: button,
  });

  button.click();
  expect(i).toBe(2);

  web.doChange({
    type: 'change',
    detail: 'event',
    value: {
      onClick: [decrement, undefined],
    },
    target: button,
  });

  button.click();
  expect(i).toBe(3);
});

it('test diffPatchReplace', () => {
  const source = h.button(['Click']);
  const target = h.div([]);

  h.evalVNode(source);
  document.body.append(document.createElement('div')); // test index
  document.body.append(...source.output!);

  expect(document.querySelectorAll('div').length).toBe(1);

  const actions = web.diffPatchReplace(source, target);

  expect(actions).toEqual([
    {
      type: 'delete',
      target: source.output,
    },
    {
      type: 'insert',
      index: 1,
      target: document.body,
      value: target.output!,
    },
  ]);

  actions.forEach(web.doAction);

  expect(document.querySelectorAll('button').length).toBe(0);
  expect(document.querySelectorAll('div').length).toBe(2);
});

it('test diffPatchText', () => {
  const source: h.VNodeText = { tag: 'text', text: 'Hello' };
  const target: h.VNodeText = { tag: 'text', text: 'World' };

  h.evalVNode(source);

  const actions = web.diffPatchText(source, target);

  expect(actions).toEqual([
    {
      type: 'change',
      detail: 'text',
      target: source.output![0],
      value: target.text,
    },
  ]);

  actions.forEach(web.doAction);

  expect(source.output![0].nodeValue).toBe('World');
});

it('test diffPatchAttributes', () => {
  const source = h.button(['Click'], {
    style: { width: 300, height: 200, color: 'blue' },
    onClick: increment,
  });
  const target = h.button(['Click'], {
    style: { height: 100, color: 'blue', bgColor: 'grey' },
    onClick: decrement,
  });

  h.evalVNode(source);

  const btn = source.output![0] as HTMLButtonElement;
  const actions = web.diffPatchAttributes(source, target);

  expect(actions).toEqual(
    [
      {
        type: 'change',
        target: btn,
        detail: 'style',
        value: { width: null, height: 100, bgColor: 'grey' },
      },
      {
        type: 'change',
        target: btn,
        detail: 'event',
        value: { onClick: [increment, decrement] },
      },
    ],
  );

  actions.forEach(web.doAction);

  btn.click();
  expect(i).toBe(-1);
});
