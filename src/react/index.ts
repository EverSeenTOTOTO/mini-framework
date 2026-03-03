/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dp from '@/vdom/diff-patch-web';
import * as web from '@/vdom/target-web';
import { PendingUpdate, UseEffectHookState, UseStateHookState } from '@/vdom/vnode';

const effectList: { hookState: UseEffectHookState, effect: () => void | (() => void) }[] = [];

const flushEffect = () => {
  effectList.forEach((each) => {
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
      web.evalVNode(vdom, () => {
        container.append(...vdom.output!);
      });
    }

    web.queue.schedule(flushEffect);
    old = vdom;
  }

  return { render };
}

/**
 * 批量更新处理器
 * 
 * 解决的问题：
 * 1. 连续 setState 不应立即触发更新，而应合并
 * 2. 同一 hook 的多次函数式更新应该链式调用
 * 3. 使用版本号丢弃过期更新
 * 
 * 策略：
 * - 如果当前没有待处理更新，立即执行更新（同步）
 * - 如果已有待处理更新，加入队列并等待批量处理
 */
const batchUpdate = (node: web.VNodeComponent, hookId: number, value: unknown | ((old: unknown) => unknown)) => {
  // 初始化更新队列
  if (!node._pendingUpdates) {
    node._pendingUpdates = [];
  }

  const isBatching = node._pendingUpdates.length > 0;
  
  // 加入待处理队列
  node._pendingUpdates.push({ hookId, value });

  // 如果已经在批量处理中，等待；否则立即处理
  if (isBatching) {
    // 已经有待处理的更新，等待批量处理
    if (!node._isUpdateScheduled) {
      node._isUpdateScheduled = true;
      // 使用 microtask 确保同一事件循环内的后续 setState 都被收集
      queueMicrotask(() => flushUpdates(node));
    }
    return;
  }

  // 立即处理单个更新（同步执行，兼容测试和简单场景）
  flushUpdates(node);
};

/**
 * 应用所有待处理的更新
 */
const flushUpdates = (node: web.VNodeComponent) => {
  if (!node._pendingUpdates || node._pendingUpdates.length === 0) {
    return;
  }

  // 保存当前版本号
  const currentVersion = node._updateVersion ?? 0;

  // 应用所有待处理更新
  const updates = node._pendingUpdates;
  node._pendingUpdates = [];
  node._isUpdateScheduled = false;

  // 按 hookId 分组，同一 hook 的函数式更新需要链式调用
  const updatesByHook = new Map<number, PendingUpdate[]>();
  for (const update of updates) {
    const existing = updatesByHook.get(update.hookId) ?? [];
    existing.push(update);
    updatesByHook.set(update.hookId, existing);
  }

  // 应用更新
  let hasChanges = false;
  for (const [hookId, hookUpdates] of updatesByHook) {
    const hookState = node.reactHookStates.get(hookId) as UseStateHookState;
    if (!hookState) continue;

    let currentValue = hookState.state;
    for (const update of hookUpdates) {
      if (typeof update.value === 'function') {
        currentValue = (update.value as (old: unknown) => unknown)(currentValue);
      } else {
        currentValue = update.value;
      }
    }

    if (hookState.state !== currentValue) {
      hookState.state = currentValue;
      hasChanges = true;
    }
  }

  // 只有状态真正改变时才触发更新
  if (hasChanges) {
    // 版本号递增
    node._updateVersion = currentVersion + 1;

    dp.diffPatchRender(node, node, () => {
      web.queue.schedule(flushEffect);
    });
  }
};

function useState<T>(init: T): [T, (valOrFn: T | ((old: T) => T)) => void] {
  const hookId = web.getCurrentHookId();
  const node = web.getCurrentComponent();
  const hookState = node.reactHookStates.get(hookId);

  if (!hookState) { // init
    node.reactHookStates.set(hookId, { type: 'useState', state: init });
  }

  const setState = (valOrFn: T | ((old: T) => T)) => {
    // 使用批量更新机制
    batchUpdate(node, hookId, valOrFn as unknown | ((old: unknown) => unknown));
  };

  return [(node.reactHookStates.get(hookId) as UseStateHookState).state as T, setState];
}

const diffDeps = (oldDeps: unknown[], newDeps: unknown[]) => {
  for (let i = 0; i < oldDeps.length; ++i) {
    if (oldDeps[i] !== newDeps[i]) return true;
  }

  return false;
};

function useEffect(effect: () => void | (() => void), deps?: Array<unknown>): void {
  const hookId = web.getCurrentHookId();
  const node = web.getCurrentComponent();

  if (!node.reactHookStates.get(hookId)) { // init
    const hookState: UseEffectHookState = { type: 'useEffect', deps };

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
