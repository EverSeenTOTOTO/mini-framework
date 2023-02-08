import * as c from '@/vdom/target-canvas';

export default { ...c, render };

let ctx: c.Context;

function render(vdom: c.VNode, canvas: HTMLCanvasElement) {
  if (!ctx) ctx = new c.Context(canvas);
  ctx.reset();
  c.emitInsts(vdom, ctx);

  // console.log(vdom.output);

  vdom.output?.forEach((inst) => c.execInst(inst, canvas.getContext('2d')!));
}
