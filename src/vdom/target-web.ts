/* eslint-disable no-param-reassign */
import type * as ts from './vnode';
import { flattern } from '@/utils';

export function evalVNode(node: ts.VNode) {
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

type Elem = Comment | HTMLElement | Text;

function evalSeq(nodes: ts.VNode[]) {
  return flattern(nodes.map(evalVNode)) as Elem[]; // flattern
}

let id = 0;
export function evalFragment(node: ts.VNodeFragment): Elem[] {
  const start = document.createComment(`fragment ${id} start`);
  const end = document.createComment(`fragment ${id} end`);

  id += 1;

  node.output = [start, end];

  return [start, ...evalSeq(node.children), end];
}

export function evalText(node: ts.VNodeText): Text {
  const text = document.createTextNode(node.text);

  node.output = text;

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

export function evalDiv(node: ts.VNodeDiv): HTMLDivElement {
  const div = document.createElement('div');

  if (node.attr?.style) {
    bindStyle(div, node.attr.style);
  }

  div.append(...evalSeq(node.children));

  node.output = div;

  return div;
}

export function evalButton(node: ts.VNodeButton): HTMLButtonElement {
  const btn = document.createElement('button');

  if (node.attr?.style) {
    bindStyle(btn, node.attr.style);
  }

  if (node.attr?.onClick) {
    btn.addEventListener('click', node.attr.onClick);
  }

  btn.append(...evalSeq(node.children));

  node.output = btn;

  return btn;
}
