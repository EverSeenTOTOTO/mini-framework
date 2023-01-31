import * as web from '@/vdom/target-web';
import { render } from '@/vdom/render-web';
// import * as web from '@/vdom/target-canvas';
// import { render } from '@/vdom/render-canvas';

export default {
  ...web,
  render,
};
