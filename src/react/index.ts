/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dp from '@/vdom/diff-patch-web';
import * as web from '@/vdom/target-web';
import { UseEffectHookState, UseStateHookState } from '@/vdom/vnode';

const effectList: { hookState: UseEffectHookState, effect: () => void | (() =>void) }[] = [];

const flushEffect = () => {
  effectList.forEach((each) => {
    // TODO: queueMicrotask
    // eslint-disable-next-line no-param-reassign
    each.hookState.clearEffect = each.effect() ?? undefined;
  });
  effectList.splice(0, effectList.length);
};

function createRoot(container: HTMLElement) {
  let old: web.VNode | undefined;

  function render(vdom: web.VNode) {
    if (old) {
      dp.diffPatchRender(old, vdom);
    } else {
      web.evalVNode(vdom);
      container.append(...vdom.output!);
    }

    flushEffect();
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
      flushEffect();
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

  if (!node.reactHookStates.get(hookId)) { // init
    const hookState:UseEffectHookState = { type: 'useEffect', deps };

    node.reactHookStates.set(hookId, hookState);
    effectList.unshift({ hookState, effect });
    return;
  }

  const hookState = node.reactHookStates.get(hookId) as UseEffectHookState;

  if (!deps || diffDeps(hookState.deps!, deps)) {
    if (hookState.clearEffect) hookState.clearEffect();

    hookState.deps = deps;
    effectList.unshift({ hookState, effect });
  }
}

function useRef<T>(init: T) {
  return useState({ current: init })[0];
}

function useMemo<T, U>(factory: () => T, deps: Array<U>) {
  const [state, setState] = useState(factory());

  useEffect(() => { setState(factory()); }, deps);

  return state;
}

export default { ...web, createRoot, useState, useEffect, useRef, useMemo, flushEffect };
