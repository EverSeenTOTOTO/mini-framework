/* eslint-disable no-param-reassign */
import * as ts from './vnode';

export function doAction(action: ts.PatchAction) {
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

export function doInsert(action: ts.ActionInsert) {
  const target = action.target as Element;
  const value = action.value as Element;
  const children = Array.from(target.children);

  if (action.index < 0 || action.index > children.length) {
    throw new Error(`Invalid insert index: ${action.index}`);
  }

  if (action.index === children.length) {
    target.append(value);
  } else {
    const sibling = target.children[action.index];

    target.insertBefore(value, sibling);
  }
}

export function doDelete(action: ts.ActionDelete) {
  const target = action.target as Element;

  if (target.parentElement) {
    target.parentElement.removeChild(target);
  }
}

export function doChange(action: ts.ActionChange) {
  switch (action.detail) {
    case 'text':
      return doChangeText(action);
    case 'style':
      return doChangeStyle(action);
    case 'event':
      return doChangeEvent(action);
    default:
      throw new Error(`Unknown action: ${action.detail}`);
  }
}

function doChangeText(action: ts.ActionChange) {
  if (!(action.target instanceof Text)) {
    throw new Error(`Invalid changeText target: ${action.target}`);
  }

  action.target.nodeValue = action.value as string;
}

function doChangeStyle(action: ts.ActionChange) {
  const target = action.target as HTMLElement;
  const styles = action.value as Record<string, string>;

  for (const prop of Object.keys(styles)) {
    const style = styles[prop];

    if (style) {
      target.style.setProperty(prop, style);
    } else {
      target.style.removeProperty(prop);
    }
  }
}

function doChangeEvent(action: ts.ActionChange) {
  const target = action.target as Element;
  const handlers = action.value as Record<string, [unknown, unknown]>;

  for (const evt of Object.keys(handlers)) {
    const [oldHandler, newHandler] = handlers[evt];

    if (typeof oldHandler === 'function') {
      target.removeEventListener(evt, oldHandler as EventListener);
    }

    if (typeof newHandler === 'function') {
      target.addEventListener(evt, newHandler as EventListener);
    }
  }
}
