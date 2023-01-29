/**
 * @jest-environment jsdom
 */

import { getByText } from '@testing-library/dom';
import * as web from './diff-patch-web';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('test doInsert', () => {
  const div = document.createElement('div');

  expect(() => web.doInsert({
    type: 'insert',
    index: -1,
    target: document.body,
    value: div,
  })).toThrow();

  expect(() => web.doInsert({
    type: 'insert',
    index: 1,
    target: document.body,
    value: div,
  })).toThrow();

  web.doInsert({
    type: 'insert',
    index: 0,
    target: document.body,
    value: div,
  });

  expect(document.querySelectorAll('div').length).toBe(1);
  expect(document.querySelector('body > div')).toBe(div);

  web.doInsert({
    type: 'insert',
    index: 0,
    target: document.body,
    value: document.createElement('div'),
  });

  expect(document.querySelectorAll('div').length).toBe(2);
  expect(document.querySelector('body > div:last-child')).toBe(div);
});

it('test doDelete', () => {
  const div = document.createElement('div');

  web.doInsert({
    type: 'insert',
    index: 0,
    target: document.body,
    value: div,
  });

  expect(document.querySelectorAll('div').length).toBe(1);

  web.doDelete({
    type: 'delete',
    target: div,
  });

  expect(document.querySelectorAll('div').length).toBe(0);
});

it('test doChange text', () => {
  const text = document.createTextNode('hello');

  web.doInsert({
    type: 'insert',
    index: 0,
    target: document.body,
    value: text,
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
    value: div,
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
      color: null,
    },
    target: div,
  });

  expect(div.style.getPropertyValue('width')).toBe('300px');
  expect(div.style.getPropertyValue('height')).toBe('200px');
  expect(div.style.getPropertyValue('color')).toBe('');
});

it('test doChange event', () => {
  const button = document.createElement('button');

  let i = 0;
  const increment = () => { i += 1; };
  const decrement = () => { i -= 1; };

  button.click();
  expect(i).toBe(0);

  web.doChange({
    type: 'change',
    detail: 'event',
    value: {
      click: [null, increment],
    },
    target: button,
  });
  web.doChange({
    type: 'change',
    detail: 'event',
    value: {
      click: [null, () => { i += 1; }], // add another increment
    },
    target: button,
  });

  button.click();
  expect(i).toBe(2);

  web.doChange({
    type: 'change',
    detail: 'event',
    value: {
      click: [increment, decrement],
    },
    target: button,
  });

  button.click();
  expect(i).toBe(2);

  web.doChange({
    type: 'change',
    detail: 'event',
    value: {
      click: [decrement],
    },
    target: button,
  });

  button.click();
  expect(i).toBe(3);
});
