/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
import { TaskQueue } from './fiber';
import * as ts from './vnode';

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

export const h = <T>(component: ((state: T) => VNode) | VueComponentDefine, state?: T) => {
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
      return component(s as T); // will call react hooks
    };
  }

  return vnode as VNodeComponent;
};

export const queue = new TaskQueue();

export function evalVNode(node: VNode, callback: (output:Node[]) => void): void {
  switch (node.tag) {
    case 'fragment':
      return evalFragment(node, callback);
    case 'text':
      return evalText(node, callback);
    case 'div':
      return evalDiv(node, callback);
    case 'button':
      return evalButton(node, callback);
    case 'component':
      return evalComponent(node, callback);
    default:
      throw new Error(`Unknown node: ${JSON.stringify(node, null, 2)}`);
  }
}

function evalSeq(nodes: VNode[], callback: (output:Node[]) => void) {
  if (nodes.length === 0) {
    callback([]);
    return;
  }

  evalVNode(nodes[0], (firstOutput) => {
    queue.schedule(
      () => evalSeq(nodes.slice(1), (restOutput) => {
        callback([...firstOutput, ...restOutput]);
      }),
    );
  });
}

let id = 0;
export function evalFragment(node: VNodeFragment, callback: (output:Node[]) => void) {
  const start = document.createComment(`fragment ${id} start`);
  const end = document.createComment(`fragment ${id} end`);

  id += 1;

  evalSeq(node.children, (output) => {
    node.output = [start, ...output, end];
    callback(node.output);
  });
}

export function evalText(node: VNodeText, callback:(output:Node[])=>void) {
  const text = document.createTextNode(node.text);

  node.output = [text];

  callback(node.output);
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

export function evalDiv(node: VNodeDiv, callback:(output: Node[]) => void) {
  const elem = document.createElement('div');

  if (node.attr?.style) {
    bindStyle(elem, node.attr.style);
  }

  evalSeq(node.children, (output) => {
    elem.append(...output);
    node.output = [elem];
    callback(node.output);
  });
}

export function evalButton(node: VNodeButton, callback:(output: Node[]) => void) {
  const btn = document.createElement('button');

  if (node.attr?.style) {
    bindStyle(btn, node.attr.style);
  }

  if (node.attr?.onClick) {
    btn.addEventListener('click', node.attr.onClick);
  }

  evalSeq(node.children, (output) => {
    btn.append(...output);
    node.output = [btn];
    callback(node.output);
  });
}

export function evalComponent(node: VNodeComponent, callback:(output: Node[]) => void) {
  const vdom = node.component(node.state);

  evalVNode(vdom, () => {
    node.output = vdom.output;
    node.vdom = vdom;

    callback(vdom.output!);
  });
}
