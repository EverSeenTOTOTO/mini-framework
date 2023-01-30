interface VNodeBase<T, Tag extends string> {
  tag: Tag,
  output?: T
}

export interface VNodeFragment<T> extends VNodeBase<T, 'fragment'> {
  attr: undefined,
  children: VNode<T>[],
}

export interface VNodeText<T> extends VNodeBase<T, 'text'> {
  text: string,
}

export type AttrStyle = {
  width?: number,
  height?: number,
  color?: string,
  bgColor?: string,
  // ...
};

export interface VNodeDiv<T> extends VNodeBase<T, 'div'> {
  attr?: {
    style?: AttrStyle
  },
  children: VNode<T>[],
}

export type AttrEvent = (event: unknown) => void;

export interface VNodeButton<T> extends VNodeBase<T, 'button'> {
  attr?: {
    style?: AttrStyle,
    onClick?: AttrEvent
  },
  children: VNode<T>[],
}

export type VNode<T> = VNodeFragment<T> | VNodeText<T> | VNodeDiv<T> | VNodeButton<T>;

// map string to VNodeText, convenient to creae plain text nodes
const mapVNode = <T>(x: VNode<T> | string) => (typeof x === 'string' ? { tag: 'text', text: x } : x);

type VNodeTags<T> = VNode<T>['tag'];

type GetVNodeType<T, Tag extends VNodeTags<T>> = VNode<T> extends infer N
  ? N extends { tag: string }
    ? N['tag'] extends Tag
      ? N
      : never
    : never
  : never;

type GetVNodeAttrType<T, Tag extends VNodeTags<T>> = GetVNodeType<T, Tag> extends infer N
  ? N extends { attr?: unknown }
    ? N['attr']
    : never
  : never;

export const createElement = <T, Tag extends VNodeTags<T>>(tag: Tag) => (children: (VNode<T> | string)[], attr?: GetVNodeAttrType<T, Tag>) => ({
  tag,
  attr,
  children: children.map(mapVNode),
} as GetVNodeType<T, Tag>);

export const fragment = createElement('fragment');
export const div = createElement('div');
export const button = createElement('button');

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

export type ActionChange<Detail extends ActionChangeDetail, T> = {
  type: 'change',
  detail: Detail,
  value: GetActionChangeValue<Detail>,
  target: T,
};

export type ActionDelete<T> = {
  type: 'delete',
  target: T
};

export type ActionInsert<T, V> = {
  type: 'insert',
  index: number,
  target: T,
  value: V
};
