/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
import type * as ts from '.';
import { flattern } from '@/utils';

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

/** ** execute instructions *** */

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

/** ** emit instructions *** */

// is there an API to track painter cursor coordinates inside a canvas?
export type Context = {
  x: number,
  y: number,
  fontSize: number
  fontFamily: string,
};

export function emitInsts(node: ts.VNode, ctx: Context = { x: 0, y: 0, fontSize: 16, fontFamily: 'sans-serif' }) {
  return [
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
    ...flattern([emitVNode(node, ctx)]),
  ];
}

function emitVNode(node: ts.VNode, ctx: Context) {
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

function emitSeq(nodes: ts.VNode[], ctx: Context) {
  return flattern(nodes.map((n) => emitVNode(n, ctx))) as RenderInst[];
}

let id = 0;
export function emitFragment(node: ts.VNodeFragment, ctx: Context): RenderInst[] {
  const start: InstComment = {
    name: 'comment',
    message: `fragment ${id} start`,
  };
  const end: InstComment = {
    name: 'comment',
    message: `fragment ${id} end`,
  };

  id += 1;

  return [start, ...emitSeq(node.children, ctx), end];
}

export function emitText(node: ts.VNodeText, ctx: Context): InstFillText {
  return {
    name: 'fillText',
    text: node.text,
    x: ctx.x,
    y: ctx.y + ctx.fontSize,
  };
}

// should obey the css flow rules, compute width top-down and compute height bottom-up,
// here we assume that the width and height are computed and always available in node.
export function emitDiv(node: ts.VNodeDiv, ctx: Context): RenderInst[] {
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
  return insts;
}

export function emitButton(node: ts.VNodeButton, ctx: Context): RenderInst[] {
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

  insts.push(...emitSeq(node.children, ctx)); // 递归下降

  if (node.attr?.onClick) {
    bindCanvasClick(node.attr.onClick, style, ctx);
  }

  insts.push({ name: 'restore' });

  return insts;
}

function bindCanvasClick(callback: (e: MouseEvent) => void, style: Required<ts.AttrStyle>, ctx: Context) {
  const canvas = document.querySelector('canvas');

  if (!canvas) throw new Error('Cannot bind canvas click, canvas element not found');

  canvas.addEventListener('click', (e: MouseEvent) => {
    if (e.offsetX >= ctx.x
      && e.offsetX <= ctx.x + style.width
      && e.offsetY >= ctx.y
      && e.offsetY <= ctx.y + style.height
    ) {
      callback(e);
    }
  });
}
