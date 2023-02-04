/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
import * as ts from './vnode';
import { flatten } from '@/utils';

export type VNodeFragment = ts.VNodeFragment<Node[]>;
export type VNodeText = ts.VNodeText<Node[]>;
export type VNodeDiv = ts.VNodeDiv<Node[]>;
export type VNodeButton = ts.VNodeButton<Node[]>;
export type VNodeComponent = ts.VNodeComponent<Node[]>;

export type VueComponentDefine = ts.VueComponentDefine<Node[]>;

export type VNode = ts.VNode<Node[]>;

export const fragment = ts.createElement<Node[], 'fragment'>('fragment');
export const div = ts.createElement<Node[], 'div'>('div');
export const button = ts.createElement<Node[], 'button'>('button');

let currentComponent: VNodeComponent;
export const getCurrentComponent = () => currentComponent;

let currentHookId = 0;
export const getCurrentHookId = () => currentHookId++;

export const h = (component: ((state: unknown) => VNode) | VueComponentDefine, state?: unknown) => {
  const vnode: Partial<VNodeComponent> = {
    tag: 'component',
    reactHookStates: new Map(),
    vueHookStates: new WeakMap(),
  };

  if ('setup' in component) { // vue component
    // order matters, setup() will call vue hooks,
    // which will fetch currentComponent
    currentComponent = vnode as VNodeComponent;
    const render = component.setup();

    vnode.component = () => {
      // for react hooks
      currentComponent = vnode as VNodeComponent;
      currentHookId = 0;
      return render(); // will call react hooks
    };
  } else { // react component
    vnode.state = state;
    vnode.component = (s?: unknown) => {
      // for react hooks
      currentComponent = vnode as VNodeComponent;
      currentHookId = 0;
      return component(s); // will call react hooks
    };
  }

  return vnode as VNodeComponent;
};

export function evalVNode(node: VNode) {
  switch (node.tag) {
    case 'fragment':
      return evalFragment(node);
    case 'text':
      return evalText(node);
    case 'div':
      return evalDiv(node);
    case 'button':
      return evalButton(node);
    case 'component':
      return evalComponent(node);
    default:
      throw new Error(`Unknown node: ${JSON.stringify(node, null, 2)}`);
  }
}

function evalSeq(nodes: VNode[]) {
  return flatten(nodes.map(evalVNode)) as Node[]; // flattern
}

let id = 0;
export function evalFragment(node: VNodeFragment): Node[] {
  const start = document.createComment(`fragment ${id} start`);
  const end = document.createComment(`fragment ${id} end`);

  id += 1;

  node.output = [start, ...evalSeq(node.children), end];

  return node.output;
}

export function evalText(node: VNodeText) {
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

export function evalDiv(node: VNodeDiv) {
  const elem = document.createElement('div');

  if (node.attr?.style) {
    bindStyle(elem, node.attr.style);
  }

  elem.append(...evalSeq(node.children));

  node.output = [elem];

  return elem;
}

export function evalButton(node: VNodeButton) {
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

export function evalComponent(node: VNodeComponent) {
  const vdom = node.component(node.state);

  evalVNode(vdom);
  node.output = vdom.output;
  node.vdom = vdom;

  return vdom.output!;
}
