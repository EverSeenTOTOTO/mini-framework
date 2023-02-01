interface VNodeBase<T, Tag extends string> {
  tag: Tag,
  output?: T,
}

export interface VNodeFragment<T> extends VNodeBase<T, 'fragment'> {
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

export type UseStateHookState = { type: 'useState', state: unknown, dirty: boolean };
export type UseEffectHookState = { type: 'useEffect', clearEffect?: () => void };

export interface VNodeComponent<T> extends VNodeBase<T, 'component'> {
  vdom?: VNode<T>,
  component: (state?: unknown) => VNode<T>,
  state?: unknown,
  hookState: Map<number, UseStateHookState | UseEffectHookState>,
}

export type VNode<T> = VNodeFragment<T> | VNodeText<T> | VNodeDiv<T> | VNodeButton<T> | VNodeComponent<T>;

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
