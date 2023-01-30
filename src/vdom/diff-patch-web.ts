/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
import { VNode, evalVNode, VNodeText } from './target-web';
import { diffObject, minimalEditSequence } from '@/utils';

/* diff-patch actions */

export type ActionChangeDetail = 'text' | 'style' | 'event';

export type ActionChangeTextValue = string;
export type ActionChangeStyleValue = { [key: string]: string | undefined };
export type ActionChangeEventValue = { [key: string]: [EventListener | undefined, EventListener | undefined] }; // [old]

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

export function diffPatch(source: VNode, target: VNode) {
  if (source.tag !== target.tag) {
    return diffPatchReplace(source, target);
  }

  if (source.tag === 'text' || target.tag === 'text') {
    return diffPatchText(source, target);
  }

  const actions: PatchAction[] = [];

  actions.push(...diffPatchChildren(source, target));
  actions.push(...diffPatchAttributes(source, target));

  target.output = source.output;

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

// exclude VNodeText
type VNodeWrap = VNode extends infer V
  ? V extends { tag: 'text' }
    ? never
    : V
  : never;

export function diffPatchAttributes(source: VNodeWrap, target: VNodeWrap) {
  const actions: PatchAction[] = [];

  diffObject(source.attr ?? {}, target.attr ?? {}, (p, n, o) => {
    actions.push(changeAttr(source, p, n, o));
  });

  return actions;
}

function changeAttr(source: VNodeWrap, key: string, newValue: any, oldValue: any): ActionChange {
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

function compareVNode(source: VNode, target: VNode) {
  return source.tag === target.tag;
}

export function diffPatchChildren(source: VNodeWrap, target: VNodeWrap) {
  const editions = minimalEditSequence(source.children, target.children, compareVNode);
  const actions: PatchAction[] = [];

  editions.forEach((e) => {
    switch (e.action) {
      case 'keep':
        actions.push(...diffPatch(e.source!, e.target!));
        break;
      case 'insert':
        evalVNode(e.target!);
        actions.push({
          type: 'insert',
          index: e.index,
          target: source.tag === 'fragment' ? source.output![0].parentElement! : source.output![0],
          value: e.target!.output!,
        });
        break;
      case 'delete':
        actions.push({
          type: 'delete',
          target: e.source!.output!,
        });
        break;
      default:
        break;
    }
  });

  return actions;
}
