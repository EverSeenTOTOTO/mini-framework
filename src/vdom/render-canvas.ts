import * as c from './target-canvas';

let ctx: c.Context;

export function render(vdom: c.VNode, canvas: HTMLCanvasElement) {
  if (!ctx) ctx = c.createContext(canvas);
  c.resetContext(ctx);
  c.emitInsts(vdom, ctx);
  vdom.output?.forEach((inst) => c.execInst(inst, canvas.getContext('2d')!));
}
