import * as c from './target-canvas';

const ctx = c.createContext();

export function render(vdom: c.VNode, canvas: HTMLCanvasElement) {
  c.resetContext(canvas, ctx);
  c.emitInsts(vdom, ctx);
  vdom.output?.forEach((inst) => c.execInst(inst, canvas.getContext('2d')!));
}
