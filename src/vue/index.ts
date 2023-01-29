import * as vdom from '@/vdom';
import { evalVNode } from '@/vdom/target-web';
import { emitInsts, execInst } from '@/vdom/target-canvas';

export default {
  ...vdom,
  evalVNode,
  emitInsts,
  execInst,
};
