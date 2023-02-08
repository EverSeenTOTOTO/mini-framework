/* eslint-disable no-param-reassign */
import * as ts from './vnode';
import { flatten } from '@/utils';

export type VNodeFragment = ts.VNodeFragment<RenderInst[]>;
export type VNodeText = ts.VNodeText<RenderInst[]>;
export type VNodeDiv = ts.VNodeDiv<RenderInst[]>;
export type VNodeButton = ts.VNodeButton<RenderInst[]>;

export type VNode = ts.VNode<RenderInst[]>;

export const fragment = ts.createElement<RenderInst[], 'fragment'>('fragment');
export const div = ts.createElement<RenderInst[], 'div'>('div');
export const button = ts.createElement<RenderInst[], 'button'>('button');

export type InstComment = {
  name: 'comment';
  message: string;
};

export type InstMoveTo = {
  name: 'moveTo';
  x: number,
  y: number
};

export type InstFillStyle = {
  name: 'fillStyle';
  style: string
};

export type InstStrokeStyle = {
  name: 'strokeStyle';
  style: string
};

export type InstFontStyle = {
  name: 'fontStyle',
  family: string,
  size: number,
};

export type InstFillRect = {
  name: 'fillRect';
  x: number,
  y: number,
  w: number,
  h: number
};

export type InstStrokeRect = {
  name: 'strokeRect';
  x: number,
  y: number,
  w: number,
  h: number
};

export type InstFillText = {
  name: 'fillText';
  text: string,
  x: number,
  y: number,
  maxw?: number
};

export type InstReset = {
  name: 'reset'
};

export type InstSave = {
  name: 'save'
};

export type InstRestore = {
  name: 'restore'
};

export type RenderInst = InstMoveTo |
InstFillStyle |
InstStrokeStyle |
InstFontStyle |
InstFillRect |
InstStrokeRect |
InstFillText |
InstReset |
InstSave |
InstRestore |
InstComment;

/* execute instructions */

export function execInst(inst: RenderInst, ctx: CanvasRenderingContext2D) {
  switch (inst.name) {
    case 'moveTo':
      return execMoveTo(inst, ctx);
    case 'fillStyle':
      return execFillStyle(inst, ctx);
    case 'strokeStyle':
      return execStrokeStyle(inst, ctx);
    case 'fontStyle':
      return execFontStyle(inst, ctx);
    case 'fillRect':
      return execFillRect(inst, ctx);
    case 'strokeRect':
      return execStrokeRect(inst, ctx);
    case 'fillText':
      return execFillText(inst, ctx);
    case 'reset':
      return execReset(inst, ctx);
    case 'save':
      return execSave(inst, ctx);
    case 'restore':
      return execRestore(inst, ctx);
    case 'comment':
      return undefined;
    default:
      throw new Error(`Unknown instruction: ${JSON.stringify(inst, null, 2)}`);
  }
}

function execMoveTo(inst: InstMoveTo, ctx: CanvasRenderingContext2D) {
  ctx.moveTo(inst.x, inst.y);
}

function execFillStyle(inst: InstFillStyle, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = inst.style;
}

function execStrokeStyle(inst: InstStrokeStyle, ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = inst.style;
}

function execFontStyle(inst: InstFontStyle, ctx: CanvasRenderingContext2D) {
  ctx.font = `${inst.size}px ${inst.family}`;
}

function execFillRect(inst: InstFillRect, ctx: CanvasRenderingContext2D) {
  ctx.fillRect(inst.x, inst.y, inst.w, inst.h);
}

function execStrokeRect(inst: InstStrokeRect, ctx: CanvasRenderingContext2D) {
  ctx.strokeRect(inst.x, inst.y, inst.w, inst.h);
}

function execFillText(inst: InstFillText, ctx: CanvasRenderingContext2D) {
  ctx.fillText(inst.text, inst.x, inst.y, inst.maxw);
}

function execReset(_inst: InstReset, ctx: CanvasRenderingContext2D) {
  // ctx.reset() is still experimental
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  ctx.moveTo(0, 0);
  // ...
}

function execSave(_inst: InstSave, ctx: CanvasRenderingContext2D) {
  ctx.save();
}

function execRestore(_inst: InstRestore, ctx: CanvasRenderingContext2D) {
  ctx.restore();
}

/* emit instructions */

// is there an API to track painter cursor coordinates inside a canvas?
export class Context {
  x = 0;

  y = 0;

  fontSize = 16;

  fontFamily = 'sans-serif';

  eventListeners: ({ event: string, callback: EventListenerOrEventListenerObject })[] = [];

  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  reset() {
    const ctx = this.canvas.getContext('2d');

    ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.x = 0;
    this.y = 0;
    this.fontSize = 16;
    this.fontFamily = 'sans-serif';
    this.eventListeners.forEach((each) => this.canvas?.removeEventListener(each.event, each.callback));
    this.eventListeners = [];
  }
}

export function emitInsts(node: VNode, ctx: Context) {
  const insts: RenderInst[] = [
    {
      name: 'reset',
    },
    {
      name: 'moveTo',
      x: ctx.x,
      y: ctx.y,
    },
    {
      name: 'fontStyle',
      size: ctx.fontSize,
      family: ctx.fontFamily,
    },
    ...flatten([emitVNode(node, ctx)]) as RenderInst[],
  ];

  node.output = insts;

  return insts;
}

function emitVNode(node: VNode, ctx: Context) {
  switch (node.tag) {
    case 'fragment':
      return emitFragment(node, ctx);
    case 'text':
      return emitText(node, ctx);
    case 'div':
      return emitDiv(node, ctx);
    case 'button':
      return emitButton(node, ctx);
    default:
      throw new Error(`Unknown node: ${JSON.stringify(node, null, 2)}`);
  }
}

function emitSeq(nodes: VNode[], ctx: Context) {
  return flatten(nodes.map((n) => emitVNode(n, ctx))) as RenderInst[];
}

let id = 0;
export function emitFragment(node: VNodeFragment, ctx: Context): RenderInst[] {
  const start: InstComment = {
    name: 'comment',
    message: `fragment ${id} start`,
  };
  const end: InstComment = {
    name: 'comment',
    message: `fragment ${id} end`,
  };

  id += 1;

  node.output = [start, ...emitSeq(node.children, ctx), end];

  return node.output;
}

export function emitText(node: VNodeText, ctx: Context) {
  const insts: RenderInst[] = [{
    name: 'fillText',
    text: node.text,
    x: ctx.x,
    y: ctx.y + ctx.fontSize,
  }];

  node.output = [insts[0]];

  return insts;
}

// should obey the css flow rules, compute width top-down and compute height bottom-up,
// here we assume that the width and height are already computed and always available in node.
export function emitDiv(node: VNodeDiv, ctx: Context): RenderInst[] {
  const insts: RenderInst[] = [];
  const style = {
    width: 0,
    height: 0,
    ...node.attr?.style,
  };

  insts.push({ name: 'save' });

  if (style.bgColor) { // draw background color for a rect
    insts.push(
      {
        name: 'fillStyle',
        style: style.bgColor,
      },
      {
        name: 'fillRect',
        x: ctx.x,
        y: ctx.y,
        w: style.width,
        h: style.height,
      },
    );
  }

  if (style.color) {
    insts.push({
      name: 'fillStyle',
      style: style.color,
    });
  }

  insts.push(...emitSeq(node.children, ctx));
  insts.push({ name: 'restore' });

  // div is a block element, set cursor to newline
  ctx.y += style.height;
  insts.push({
    name: 'moveTo',
    x: ctx.x,
    y: ctx.y,
  });

  node.output = insts;

  return insts;
}

export function emitButton(node: VNodeButton, ctx: Context): RenderInst[] {
  const insts: RenderInst[] = [];
  const style = {
    // default button style
    width: 67,
    height: 21,
    color: '#000',
    bgColor: 'buttonface',
    ...node.attr?.style,
  };

  insts.push({ name: 'save' });
  insts.push(
    {
      name: 'fillStyle',
      style: style.bgColor,
    },
    {
      name: 'fillRect',
      x: ctx.x,
      y: ctx.y,
      w: style.width,
      h: style.height,
    },
    {
      name: 'strokeStyle',
      style: '#000',
    },
    {
      name: 'strokeRect',
      x: ctx.x,
      y: ctx.y,
      w: style.width,
      h: style.height,
    },
  );

  if (style.color) {
    insts.push({
      name: 'fillStyle',
      style: style.color,
    });
  }

  insts.push(...emitSeq(node.children, ctx)); // recursive descent

  if (node.attr?.onClick) {
    bindCanvasClick(node.attr.onClick, style, ctx);
  }

  insts.push({ name: 'restore' });

  ctx.x += style.width;
  insts.push({
    name: 'moveTo',
    x: ctx.x,
    y: ctx.y,
  });

  node.output = insts;

  return insts;
}

function bindCanvasClick(cb: (e: MouseEvent) => void, style: Required<ts.AttrStyle>, ctx: Context) {
  const { x, y } = ctx;
  const callback: EventListenerOrEventListenerObject = (evt: Event) => {
    const e = evt as MouseEvent;

    if (e.offsetX >= x
      && e.offsetX <= x + style.width
      && e.offsetY >= y
      && e.offsetY <= y + style.height
    ) {
      cb(e);
    }
  };

  ctx.canvas.addEventListener('click', callback);
  ctx.eventListeners.push({ event: 'click', callback });
}
