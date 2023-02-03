/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
import * as web from '@/vdom/target-web';
import * as dp from '@/vdom/diff-patch-web';
import type { VNode } from '@/vdom/target-web';
import { Effect } from '@/vdom/vnode';

export default { ...web, createApp, ref, watch };

function createApp(vdom: VNode) {
  let mounted = false;
  function mount(container: HTMLElement) {
    if (!mounted) {
      web.evalVNode(vdom);
      container.append(...vdom.output!);
      mounted = true;
    } else {
      console.warn('App already mounted');
    }
  }

  return { mount };
}

function ref<T>(init: T) {
  const node = web.getCurrentComponent();

  const proxy = new Proxy({ value: init }, {
    set(t, p, v, r) {
      const oldValue = t.value;
      const result = Reflect.set(t, p, v, r);
      // recompiling vdom will need the latest value,
      // so we memorize oldValue and call setter first, then notify observers
      const record = node.vueHookStates.get(proxy)!;

      record.forEach((ob) => ob(v, oldValue));

      return result;
    },
    get(t, p, r) { // track if render function did use this state
      const record = node.vueHookStates.get(proxy)!;

      record.push((n, o) => {
        if (n !== o) {
          dp.diffPatchRender(node, node);
        }
      });

      return Reflect.get(t, p, r);
    },
  });

  node.vueHookStates.set(proxy, []); // init

  return proxy;
}

function watch<T>(refValue: { value: T }, callback: Effect<T>) {
  const node = web.getCurrentComponent();
  const observer = callback as Effect<unknown>;
  const record = node.vueHookStates!.get(refValue)!;

  record.push(observer);

  return () => {
    const index = record.indexOf(observer);

    if (index >= 0) record.splice(index, 1);
  };
}
