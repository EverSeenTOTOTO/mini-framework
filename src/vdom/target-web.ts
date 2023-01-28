/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
import type * as ts from '.';

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

function evalSeq(nodes: ts.VNode[]): Elem[] {
  return nodes.map(evalVNode).reduce((p: Elem[], c) => [...p, ...(Array.isArray(c) ? c : [c])], []); // flattern
}

let id = 0;
export function evalFragment(node: ts.VNodeFragment): Elem[] {
  const start = document.createComment(`fragment ${id} start`);
  const end = document.createComment(`fragment ${id} end`);

  id += 1;

  return [start, ...evalSeq(node.children), end];
}

export function evalText(node: ts.VNodeText): Text {
  return document.createTextNode(node.text);
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
}

export function evalDiv(node: ts.VNodeDiv): HTMLDivElement {
  const div = document.createElement('div');

  if (node.attr?.style) {
    bindStyle(div, node.attr.style);
  }

  div.append(...evalSeq(node.children));

  return div;
}

export function evalButton(node: ts.VNodeButton): HTMLButtonElement {
  const btn = document.createElement('button');

  if (node.attr?.style) {
    bindStyle(btn, node.attr.style);
  }

  if (node.attr?.onClick) {
    btn.onclick = node.attr.onClick;
  }

  btn.append(...evalSeq(node.children));

  return btn;
}
