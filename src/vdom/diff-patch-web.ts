/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
import * as ts from './vnode';
import { VNode, evalVNode, VNodeText } from './target-web';
import { diffObject } from '@/utils';

export type ActionChangeText = ts.ActionChange<'text', Node>;
export type ActionChangeStyle = ts.ActionChange<'style', Node>;
export type ActionChangeEvent = ts.ActionChange<'event', Node>;

export type ActionChange = ActionChangeText | ActionChangeStyle | ActionChangeEvent;
export type ActionDelete = ts.ActionDelete<Node[]>;
export type ActionInsert = ts.ActionInsert<Node, Node[]>;

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

  if (action.index < 0 || action.index > children.length) {
    throw new Error(`Invalid insert index: ${action.index}`);
  }

  if (action.index === children.length) {
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
      return doChangeText(action);
    case 'style':
      return doChangeStyle(action);
    case 'event':
      return doChangeEvent(action);
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

export function diffPatch(source: VNode, target: VNode) {
  const actions: PatchAction[] = [];
  if (source.tag !== target.tag) {
    return diffPatchReplace(source, target);
  }

  if (source.tag === 'text' || target.tag === 'text') {
    return diffPatchText(source, target);
  }

  actions.push(...diffPatchChildren(source, target));

  if (source.tag !== 'fragment' && target.tag !== 'fragment') {
    actions.push(...diffPatchAttributes(source, target));
  }

  return actions;
}

export function diffPatchReplace(source: VNode, target: VNode): PatchAction[] {
  const old = source.output!;
  const parent = old[0].parentElement;

  if (!parent) throw new Error('parent not found');

  const index = Array.from(parent.children).indexOf(old[0] as Element);

  evalVNode(target);

  return [
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
  ];
}

export function diffPatchText(source: VNode, target: VNode): PatchAction[] {
  const s = source as VNodeText;
  const t = target as VNodeText;

  if (s.text !== t.text) {
    return [{
      type: 'change',
      detail: 'text',
      target: s.output![0],
      value: t.text,
    }];
  }

  return [];
}

type VNodeWithAttributes = VNode extends infer V
  ? V extends { attr?: unknown }
    ? V
    : never
  : never;

export function diffPatchAttributes(source: VNodeWithAttributes, target: VNodeWithAttributes) {
  const actions: PatchAction[] = [];

  diffObject(source.attr ?? {}, target.attr ?? {}, (p, n, o) => {
    actions.push(changeAttr(source, p, n, o));
  });

  return actions;
}

function changeAttr(source: VNodeWithAttributes, key: string, newValue: any, oldValue: any): ActionChange {
  const createStyleValue = () => {
    const result: Record<string, any> = {};

    diffObject(oldValue ?? {}, newValue ?? {}, (p, n) => {
      result[p] = n;
    });

    return result;
  };
  const createEventValue = () => ({ [key]: [oldValue, newValue] });

  return {
    type: 'change',
    target: source.output![0],
    detail: key === 'style' ? key : 'event',
    value: key === 'style' ? createStyleValue() : createEventValue(),
  };
}

type VNodeWithChildren = VNode extends infer V
  ? V extends { children: unknown }
    ? V
    : never
  : never;

function diffPatchChildren(source: VNodeWithChildren, target: VNodeWithChildren) {
  console.log(source, target);
  return [];
}
