/* eslint-disable no-param-reassign */
import * as ts from './vnode';

export type PatchActionWeb = ts.ActionChange<ts.ActionChangeDetail, Node> |
ts.ActionDelete<Node> |
ts.ActionInsert<Node, Node[]>;

export function doAction(action: PatchActionWeb) {
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

export function doInsert(action: ts.ActionInsert<Node, Node[]>) {
  if (!(action.target instanceof HTMLElement)) throw new Error('Target is not an HTMLElement');

  const children = Array.from(action.target.children);

  if (action.index < 0 || action.index > children.length) {
    throw new Error(`Invalid insert index: ${action.index}`);
  }

  if (action.index === children.length) {
    action.target.append(...action.value);
  } else {
    const sibling = action.target.children[action.index];

    action.value.reduce<Node>((p, c) => {
      action.target.insertBefore(c, p);
      return c;
    }, sibling);
  }
}

export function doDelete(action: ts.ActionDelete<Node>) {
  if (action.target.parentElement) {
    action.target.parentElement.removeChild(action.target);
  }
}

export function doChange(action: ts.ActionChange<ts.ActionChangeDetail, Node>) {
  switch (action.detail) {
    case 'text':
      return doChangeText(action as ts.ActionChange<'text', Node>);
    case 'style':
      return doChangeStyle(action as ts.ActionChange<'style', Node>);
    case 'event':
      return doChangeEvent(action as ts.ActionChange<'event', Node>);
    default:
      throw new Error(`Unknown action: ${action.detail}`);
  }
}

function doChangeText(action: ts.ActionChange<'text', Node>) {
  action.target.nodeValue = action.value as string;
}

function doChangeStyle(action: ts.ActionChange<'style', Node>) {
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

function doChangeEvent(action: ts.ActionChange<'event', Node>) {
  for (const evt of Object.keys(action.value)) {
    const [oldHandler, newHandler] = action.value[evt];

    if (oldHandler) {
      action.target.removeEventListener(evt, oldHandler);
    }

    if (newHandler) {
      action.target.addEventListener(evt, newHandler);
    }
  }
}
