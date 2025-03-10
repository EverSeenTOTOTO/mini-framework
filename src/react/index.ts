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

function useState<T>(init: T): [T, (valOrFn: T | ((old: T) => T)) => void] {
  const hookId = web.getCurrentHookId();
  const node = web.getCurrentComponent();
  const hookState = node.reactHookStates.get(hookId);

  if (!hookState) { // init
    node.reactHookStates.set(hookId, { type: 'useState', state: init });
  }

  const setState = (valOrFn: T | ((old: T) => T)) => {
    const latest = node.reactHookStates.get(hookId) as UseStateHookState;
    const value = typeof valOrFn === 'function' ? (valOrFn as (old:T) =>T)(latest.state as T) : valOrFn;

    if (latest.state !== value) {
      latest.state = value;

      // diffPatchComponent will recompile vdom, which reexecutes useState and get the latest value
      // so the new generated vdom will be different from the old `node.vdom`
      dp.diffPatchRender(node, node);
    }
  };

  return [(node.reactHookStates.get(hookId) as UseStateHookState).state as T, setState];
}

const diffDeps = (oldDeps: unknown[], newDeps:unknown[]) => {
  for (let i = 0; i < oldDeps.length; ++i) {
    if (oldDeps[i] !== newDeps[i]) return true;
  }

  return false;
};

function useEffect(effect: () => void | (() => void), deps?: Array<unknown>): void {
  const hookId = web.getCurrentHookId();
  const node = web.getCurrentComponent();
  const hookState = node.reactHookStates.get(hookId);

  if (!hookState) { // init
    node.reactHookStates.set(hookId, { type: 'useEffect', clearEffect: effect() ?? undefined, deps });
    return;
  }

  if (hookState.type !== 'useEffect') return;

  if (!deps || diffDeps(hookState.deps!, deps)) {
    const { clearEffect } = node.reactHookStates.get(hookId) as UseEffectHookState;

    if (clearEffect) clearEffect();

    node.reactHookStates.set(hookId, { type: 'useEffect', clearEffect: effect() ?? undefined, deps });
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
