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

/**
 * EvalContext: 解决异步求值时的竞态条件
 * 
 * 问题：之前的 currentComponent 和 currentHookId 是全局变量，
 * 当任务队列中断并切换到其他任务时，这些全局变量会被污染。
 * 
 * 解决方案：
 * 1. 使用 EvalContext 管理求值上下文
 * 2. hookId 存储在 VNodeComponent 上，避免全局状态
 * 3. currentComponent 只在组件函数执行期间有效
 */
export class EvalContext {
  private static stack: EvalContext[] = [];
  
  component: VNodeComponent;
  
  constructor(component: VNodeComponent) {
    this.component = component;
  }
  
  /** 进入组件上下文 */
  static enter(component: VNodeComponent): EvalContext {
    const ctx = new EvalContext(component);
    EvalContext.stack.push(ctx);
    // 重置 hookId（存储在组件上）
    component._currentHookId = 0;
    return ctx;
  }
  
  /** 退出组件上下文 */
  static exit(): void {
    EvalContext.stack.pop();
  }
  
  /** 获取当前上下文 */
  static current(): EvalContext | undefined {
    return EvalContext.stack[EvalContext.stack.length - 1];
  }
  
  /** 在指定上下文中执行函数 */
  static run<T>(component: VNodeComponent, fn: () => T): T {
    EvalContext.enter(component);
    try {
      return fn();
    } finally {
      EvalContext.exit();
    }
  }
  
  /** 获取下一个 hookId */
  static nextHookId(): number {
    const ctx = EvalContext.current();
    if (!ctx) {
      throw new Error('useState/useEffect must be called inside a component');
    }
    if (ctx.component._currentHookId === undefined) {
      ctx.component._currentHookId = 0;
    }
    return ctx.component._currentHookId++;
  }
  
  /** 获取当前组件 */
  static getCurrentComponent(): VNodeComponent {
    const ctx = EvalContext.current();
    if (!ctx) {
      throw new Error('Hooks must be called inside a component');
    }
    return ctx.component;
  }
}

// 兼容旧 API
export const getCurrentComponent = () => EvalContext.getCurrentComponent();
export const getCurrentHookId = () => EvalContext.nextHookId();

export const h = <T>(component: ((state: T) => VNode) | VueComponentDefine, state?: T) => {
  const vnode: Partial<VNodeComponent> = {
    tag: 'component',
    reactHookStates: new Map(),
    vueHookStates: new WeakMap(),
    _currentHookId: 0,
  };

  if ('setup' in component) { // vue component
    // setup() will call vue hooks, which will fetch currentComponent
    EvalContext.run(vnode as VNodeComponent, () => {
      const render = component.setup();
      vnode.component = () => EvalContext.run(vnode as VNodeComponent, render);
    });
  } else { // react component
    vnode.state = state;
    vnode.component = (s?: unknown) => 
      EvalContext.run(vnode as VNodeComponent, () => component(s as T));
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
