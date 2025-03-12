/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
import { diffObject, minimalEditSequence } from '@/utils';
import { evalVNode, VNode, VNodeComponent, VNodeText } from './target-web';

/* diff-patch actions */

export type ActionChangeDetail = 'text' | 'style' | 'event';

export type ActionChangeTextValue = string;
export type ActionChangeStyleValue = { [key: string]: string | undefined };
export type ActionChangeEventValue = { [key: string]: [EventListener | undefined, EventListener | undefined] }; // [old, new]

type GetActionChangeValue<Detail extends ActionChangeDetail> = Detail extends 'text'
  ? ActionChangeTextValue
  : Detail extends 'style'
    ? ActionChangeStyleValue
    : Detail extends 'event'
      ? ActionChangeEventValue
      : never;

export type ActionChange<Detail extends ActionChangeDetail = ActionChangeDetail> = {
  type: 'change',
  detail: Detail,
  value: GetActionChangeValue<Detail>,
  target: Node,
};

export type ActionDelete = {
  type: 'delete',
  target: Node[], // nodes to delete
};

export type ActionInsert = {
  type: 'insert',
  index: number,
  target: Node, // parentElement
  value: Node[]
};

export type ActionChangeText = ActionChange<'text'>;
export type ActionChangeStyle = ActionChange<'style'>;
export type ActionChangeEvent = ActionChange<'event'>;

export type PatchAction = ActionChange | ActionDelete | ActionInsert;

export function doAction(action: PatchAction) {
  switch (action.type) {
    case 'change':
      return doChange(action);
    case 'insert':
      return doInsert(action);
    case 'delete':
      return doDelete(action);
    default:
      throw new Error('Unknown action');
  }
}

export function doInsert(action: ActionInsert) {
  if (!(action.target instanceof HTMLElement)) throw new Error('Target is not an HTMLElement');

  const children = Array.from(action.target.children);

  if (action.index < 0) {
    throw new Error(`Invalid insert index: ${action.index}`);
  }

  if (action.index >= children.length) {
    action.target.append(...action.value);
  } else {
    const sibling = action.target.children[action.index];

    action.value.reduce<Node>((p, c) => { action.target.insertBefore(c, p); return c; }, sibling);
  }
}

export function doDelete(action: ActionDelete) {
  action.target.forEach((target) => {
    if (target.parentElement) {
      target.parentElement.removeChild(target);
    }
  });
}

export function doChange(action: ActionChange) {
  switch (action.detail) {
    case 'text':
      return doChangeText(action as ActionChangeText);
    case 'style':
      return doChangeStyle(action as ActionChangeStyle);
    case 'event':
      return doChangeEvent(action as ActionChangeEvent);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function doChangeText(action: ActionChangeText) {
  action.target.nodeValue = action.value as string;
}

function doChangeStyle(action: ActionChangeStyle) {
  if (!(action.target instanceof HTMLElement)) throw new Error('Target is not an HTMLElement');

  for (const prop of Object.keys(action.value)) {
    const style = action.value[prop];

    if (style) {
      action.target.style.setProperty(prop, style);
    } else {
      action.target.style.removeProperty(prop);
    }
  }
}

function doChangeEvent(action: ActionChangeEvent) {
  for (const evt of Object.keys(action.value)) {
    const [oldHandler, newHandler] = action.value[evt];
    const event = evt.toLowerCase().replace(/^on/, ''); // onClick -> click

    if (oldHandler) {
      action.target.removeEventListener(event, oldHandler);
    }

    if (newHandler) {
      action.target.addEventListener(event, newHandler);
    }
  }
}

/* naive diff patch algorithm */

export function diffPatchRender(oldVNode: VNode, newVNode: VNode, callback = () => {}) {
  diffPatch(oldVNode, newVNode, (actions) => {
    actions.forEach(doAction); // patch
    callback();
  });
}

export function diffPatch(source: VNode, target: VNode, callback: (actions: PatchAction[]) => void) {
  if (source.tag !== target.tag) {
    diffPatchReplace(source, target, callback);
    return;
  }

  if (source.tag === 'text') {
    diffPatchText(source, target, (actions) => {
      // actions operate on source.output, by setting target.output === source.output we reuse the DOM node
      target.output = source.output;
      callback(actions);
    });
  } else if (source.tag === 'component') {
    diffPatchComponent(source, target as VNodeComponent, (actions) => {
      target.output = source.output;
      callback(actions);
    });
  } else {
    diffPatchChildren(source, target as VNodeWithChildren, (childActions) => {
      if (source.tag !== 'fragment') {
        diffPatchAttributes(source, target as VNodeWithAttr, (attrActions) => {
          target.output = source.output;
          callback([...childActions, ...attrActions]);
        });
        return;
      }
      target.output = source.output;
      callback(childActions);
    });
  }
}

export function diffPatchReplace(source: VNode, target: VNode, callback: (actions: PatchAction[]) => void) {
  const old = source.output!;
  const parent = old[0].parentElement;

  if (!parent) throw new Error('parent not found');

  const index = Array.from(parent.children).indexOf(old[0] as Element);

  evalVNode(target, () => {
    callback([
      {
        type: 'delete',
        target: old,
      },
      {
        type: 'insert',
        index,
        target: parent,
        value: target.output!,
      },
    ]);
  });
}

export function diffPatchText(source: VNode, target: VNode, callback: (actions: PatchAction[]) => void) {
  const s = source as VNodeText;
  const t = target as VNodeText;

  callback(s.text !== t.text
    ? [{
      type: 'change',
      detail: 'text',
      target: s.output![0],
      value: t.text,
    }]
    : []);
}

export function diffPatchComponent(source: VNodeComponent, target: VNodeComponent, callback: (actions: PatchAction[]) => void) {
  if (!source.vdom) throw new Error('source not initialized');

  target.reactHookStates = source.reactHookStates;
  target.vueHookStates = source.vueHookStates;

  const vdom = target.component(target.state);
  diffPatch(source.vdom, vdom, (actions) => {
    target.vdom = vdom;
    callback(actions);
  });
}

// VNodes that has attr and children
type VNodeWithAttr = VNode extends infer V
  ? V extends { attr?: unknown }
    ? V
    : never
  : never;

export function diffPatchAttributes(source: VNodeWithAttr, target: VNodeWithAttr, callback: (actions: PatchAction[]) => void) {
  const actions: PatchAction[] = [];

  diffObject(source.attr ?? {}, target.attr ?? {}, (p, n, o) => {
    const action = changeAttr(source, p, n, o);

    if (Object.keys(action.value).length > 0) {
      actions.push(action);
    }
  });

  callback(actions);
}

function changeAttr(source: VNodeWithAttr, key: string, newValue: any, oldValue: any): ActionChange {
  const createStyleValue = () => {
    const result: Record<string, any> = {};

    diffObject(oldValue ?? {}, newValue ?? {}, (p, n) => {
      result[p] = n;
    });

    return result;
  };
  const createEventValue = () => (oldValue === newValue ? {} : { [key]: [oldValue, newValue] });

  return {
    type: 'change',
    target: source.output![0],
    detail: key === 'style' ? key : 'event',
    value: key === 'style' ? createStyleValue() : createEventValue(),
  };
}

function compareVNode(source: VNode, target: VNode) {
  return source.tag === target.tag;
}

type VNodeWithChildren = VNode extends infer V
  ? V extends { children: unknown }
    ? V
    : never
  : never;

export function diffPatchChildren(source: VNodeWithChildren, target: VNodeWithChildren, callback: (actions: PatchAction[]) => void) {
  const editions = minimalEditSequence(source.children, target.children, compareVNode);

  const helper = (edits: typeof editions, cb: typeof callback) => {
    if (edits.length === 0) {
      cb([]);
      return;
    }

    const e = edits[0];

    switch (e.action) {
      case 'keep':
        diffPatch(e.source!, e.target!, (firstActions) => {
          helper(edits.slice(1), (restActions) => {
            cb([...firstActions, ...restActions]);
          });
        });
        break;
      case 'insert':
        evalVNode(e.target!, () => {
          helper(edits.slice(1), (restActions) => {
            cb([{
              type: 'insert',
              index: e.index,
              target: source.tag === 'fragment' ? source.output![0].parentElement! : source.output![0],
              value: e.target!.output!,
            }, ...restActions]);
          });
        });
        break;
      case 'delete':
        helper(edits.slice(1), (restActions) => {
          cb([{
            type: 'delete',
            target: e.source!.output!,
          }, ...restActions]);
        });
        break;
      default:
        break;
    }
  };

  helper(editions, callback);
}
