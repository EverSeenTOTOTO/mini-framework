/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as web from '@/vdom/target-web';
import * as dp from '@/vdom/diff-patch-web';
import { UseEffectHookState, UseStateHookState } from '@/vdom/vnode';

export default { ...web, createRoot, useState, useEffect, useRef, useMemo };

function createRoot(container: HTMLElement) {
  let old: web.VNode | undefined;

  function render(vdom: web.VNode) {
    if (old) {
      dp.diffPatchRender(old, vdom);
    } else {
      web.evalVNode(vdom);
      container.append(...vdom.output!);
    }

    old = vdom;
  }

  return { render };
}

function useState<T>(init: T): [T, (value: T) => void] {
  const hookId = web.getCurrentHookId();
  const node = web.getCurrentComponent();

  const setState = (value: T) => {
    const record = node.hookState?.get(hookId) as UseStateHookState;

    if (!record) throw new Error('hook not initialized');

    if (record.state !== value) {
      record.state = value;
      record.dirty = true;

      // diffPatchComponent will recompile vdom, which reexecutes useState and get the latest value
      dp.diffPatchRender(node, node);

      record.dirty = false;
    }
  };

  if (!node.hookState.get(hookId)) { // init
    node.hookState.set(hookId, { type: 'useState', state: init, dirty: false });
  }

  return [(node.hookState.get(hookId) as UseStateHookState).state as T, setState];
}

function useEffect(effect: () => void | (() => void), deps: Array<unknown>): void {
  const hookId = web.getCurrentHookId();
  const node = web.getCurrentComponent();

  if (!node.hookState.get(hookId)) { // init
    node.hookState.set(hookId, { type: 'useEffect', clearEffect: effect() ?? undefined });
  } else {
    for (const hookState of node.hookState.values()) {
      if (hookState.type === 'useState') {
        if (deps.includes(hookState.state) && hookState.dirty) {
          const { clearEffect } = node.hookState.get(hookId) as UseEffectHookState;

          if (clearEffect) clearEffect();

          node.hookState.set(hookId, { type: 'useEffect', clearEffect: effect() ?? undefined });
          break;
        }
      }
    }
  }
}

function useRef<T>(init: T) {
  return useState({ current: init })[0];
}

function useMemo<T, U>(factory: () => T, deps: Array<U>) {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => { ref.current = factory(); }, deps);

  return ref.current as T;
}
