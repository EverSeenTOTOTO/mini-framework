/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
import * as web from '@/vdom/target-web';
import * as dp from '@/vdom/diff-patch-web';
import type { VNode } from '@/vdom/target-web';
import { Effect } from '@/vdom/vnode';
import { flushEffect } from '@/react';

export default { ...web, createApp, ref, watch };

function createApp(vdom: VNode) {
  let mounted = false;
  function mount(container: HTMLElement) {
    if (!mounted) {
      web.evalVNode(vdom);
      container.append(...vdom.output!);
      flushEffect();
      mounted = true;
    } else {
      console.warn('App already mounted');
    }
  }

  return { mount };
}

function ref<T>(init: T) {
  const node = web.getCurrentComponent();
  const rerender = (n: unknown, o: unknown) => {
    if (n !== o) {
      dp.diffPatchRender(node, node);
      flushEffect();
    }
  };

  const proxy = new Proxy({ value: init }, {
    set(t, p, v, r) {
      const oldValue = t.value;
      const result = Reflect.set(t, p, v, r);
      // recompiling vdom will need the latest value,
      // so we memorize oldValue and call setter first, then notify observers
      const effects = node.vueHookStates.get(proxy)!;

      effects.forEach((ob) => ob(v, oldValue));

      return result;
    },
    get(t, p, r) { // track if render function did use this state
      const effects = node.vueHookStates.get(proxy)!;

      if (!effects.includes(rerender)) {
        effects.push(rerender);
      }

      return Reflect.get(t, p, r);
    },
  });

  node.vueHookStates.set(proxy, []); // init

  return proxy;
}

function watch<T>(refValue: { value: T }, callback: Effect<T>) {
  const node = web.getCurrentComponent();
  const observer = callback as Effect<unknown>;
  const effects = node.vueHookStates!.get(refValue)!;

  effects.push(observer);

  return () => {
    const index = effects.indexOf(observer);

    if (index >= 0) effects.splice(index, 1);
  };
}
