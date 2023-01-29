import * as vnode from '@/vdom/vnode';
import { evalVNode } from '@/vdom/target-web';
import { emitInsts, execInst } from '@/vdom/target-canvas';

export default {
  ...vnode,
  evalVNode,
  emitInsts,
  execInst,
};
