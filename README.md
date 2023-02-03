# mini-framework

A minimal (915 lines of code excluding tests) implementation for React and Vue, for fun and personal learning.

For more information, read my post [here](https://github.com/EverSeenTOTOTO/frontend-interview/blob/main/Framework.md). Example usages can be found in [samle](./sample) folder.

**Crazy mind**:

```ts
const counter = {
  setup() {
    const ref = vue.ref(1);

    vue.watch(ref, (n) => console.log(n));

    return () => {
      const [count, setCount] = react.useState(ref.value * 2);

      react.useEffect(() => fn(count), [count]);

      return w.fragment([
        w.button(['Click Vue'], { onClick: () => { ref.value += 1; } }),
        w.button(['Click React'], { onClick: () => setCount(count + 1) }),
      ]);
    };
  },
};
```

## Targets

The VDOM layer can be compiled to different targets:

1. Web: normally render to HTML DOM

    <img src="./target-web.gif" width="1200" />

2. Canvas: compile to virtual render instructions and paint in `canvas`

    <img src="./target-canvas.gif" width="1200" />

3. QT: render to [nodegui](https://github.com/nodegui/nodegui) components

4. Terminal: render to terminal

5. ...
