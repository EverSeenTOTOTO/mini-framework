/* eslint-disable no-param-reassign */
import * as ts from './vnode';
import { flattern } from '@/utils';

export const fragment = ts.createElement<Node[], 'fragment'>('fragment');
export const div = ts.createElement<Node[], 'div'>('div');
export const button = ts.createElement<Node[], 'button'>('button');

export function evalVNode(node: ts.VNode<Node[]>) {
  switch (node.tag) {
    case 'fragment':
      return evalFragment(node);
    case 'text':
      return evalText(node);
    case 'div':
      return evalDiv(node);
    case 'button':
      return evalButton(node);
    default:
      throw new Error(`Unknown node: ${JSON.stringify(node, null, 2)}`);
  }
}

function evalSeq(nodes: ts.VNode<Node[]>[]) {
  return flattern(nodes.map(evalVNode)) as Node[]; // flattern
}

let id = 0;
export function evalFragment(node: ts.VNodeFragment<Node[]>): Node[] {
  const start = document.createComment(`fragment ${id} start`);
  const end = document.createComment(`fragment ${id} end`);

  id += 1;

  node.output = [start, ...evalSeq(node.children), end];

  return node.output;
}

export function evalText(node: ts.VNodeText<Node[]>): Text {
  const text = document.createTextNode(node.text);

  node.output = [text];

  return text;
}

function bindStyle(el: HTMLElement, style: ts.AttrStyle) {
  if (style.width) {
    el.style.width = `${style.width}px`;
  }

  if (style.height) {
    el.style.height = `${style.height}px`;
  }

  if (style.color) {
    el.style.color = style.color;
  }

  if (style.bgColor) {
    el.style.backgroundColor = style.bgColor;
  }
}

export function evalDiv(node: ts.VNodeDiv<Node[]>): HTMLDivElement {
  const elem = document.createElement('div');

  if (node.attr?.style) {
    bindStyle(elem, node.attr.style);
  }

  elem.append(...evalSeq(node.children));

  node.output = [elem];

  return elem;
}

export function evalButton(node: ts.VNodeButton<Node[]>): HTMLButtonElement {
  const btn = document.createElement('button');

  if (node.attr?.style) {
    bindStyle(btn, node.attr.style);
  }

  if (node.attr?.onClick) {
    btn.addEventListener('click', node.attr.onClick);
  }

  btn.append(...evalSeq(node.children));

  node.output = [btn];

  return btn;
}
