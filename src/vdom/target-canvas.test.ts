/**
 * @jest-environment jsdom
 */

import * as c from './target-canvas';

let canvas: HTMLCanvasElement;
beforeAll(() => {
  canvas = document.createElement('canvas');
  document.body.append(canvas);
});

it('test emitVNode', () => {
  const insts = c.emitInsts(c.fragment([
    c.div(
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
    c.button(
      ['Click Me'],
      {
        onClick: () => console.log('hello world'),
      },
    ),
  ]), new c.Context(canvas));

  console.log(insts);

  expect(insts).toEqual(
    [
      { name: 'reset' },
      { name: 'moveTo', x: 0, y: 0 },
      { name: 'fontStyle', size: 16, family: 'sans-serif' },
      { name: 'comment', message: 'fragment 0 start' },
      { name: 'save' },
      { name: 'fillStyle', style: '#e4e4e4' },
      { name: 'fillRect', x: 0, y: 0, w: 300, h: 50 },
      { name: 'fillStyle', style: 'blue' },
      { name: 'fillText', text: 'Hello World', x: 0, y: 16 },
      { name: 'restore' },
      { name: 'moveTo', x: 0, y: 50 },
      { name: 'save' },
      { name: 'fillStyle', style: 'buttonface' },
      { name: 'fillRect', x: 0, y: 50, w: 67, h: 21 },
      { name: 'strokeStyle', style: '#000' },
      { name: 'strokeRect', x: 0, y: 50, w: 67, h: 21 },
      { name: 'fillStyle', style: '#000' },
      { name: 'fillText', text: 'Click Me', x: 0, y: 66 },
      { name: 'restore' },
      { name: 'moveTo', x: 67, y: 50 },
      { name: 'comment', message: 'fragment 0 end' },
    ]
    ,
  );
});
