export type VNodeFragment = {
  tag: 'fragment',
  children: VNode[],
};

export type VNodeText = {
  tag: 'text',
  text: string,
};

export type AttrStyle = {
  width?: number,
  height?: number,
  color?: string,
  bgColor?: string,
  // ...
};

export type VNodeDiv = {
  tag: 'div',
  attr?: {
    style?: AttrStyle
  },
  children: VNode[],
};

export type AttrEvent = (event: unknown) => void;

export type VNodeButton = {
  tag: 'button',
  attr?: {
    style?: AttrStyle,
    onClick?: AttrEvent
  },
  children: VNode[],
};

export type VNode = VNodeFragment | VNodeText | VNodeDiv | VNodeButton;
export type VNodeTags = VNode['tag'];

// map string to VNodeText, convenient to creae plain text nodes
const mapVNode = (x: VNode | string) => (typeof x === 'string' ? { tag: 'text', text: x } : x);

type GetVNodeType<Tag extends VNodeTags> = VNode extends infer T
  ? T extends { tag: string }
    ? T['tag'] extends Tag
      ? T
      : never
    : never
  : never;

type GetVNodeAttrType<Tag extends VNodeTags> = GetVNodeType<Tag> extends infer T
  ? T extends { attr?: unknown }
    ? T['attr']
    : never
  : never;

const createElement = <Tag extends VNodeTags>(tag: Tag) => (children: (VNode | string)[], attr?: GetVNodeAttrType<Tag>) => ({
  tag,
  attr,
  children: children.map(mapVNode),
} as GetVNodeType<Tag>);

export const fragment = createElement('fragment');
export const div = createElement('div');
export const button = createElement('button');
