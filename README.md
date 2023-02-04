# mini-framework

A minimal (<1000 lines of code excluding tests) implementation for React and Vue, for fun and personal learning.

For more information, read my post [here](https://github.com/EverSeenTOTOTO/frontend-interview/blob/main/Framework.md). Example usages can be found in [samle](./sample) folder.

**Crazy mind**:

```ts
const {div, button, fragment, h, vue, react} = window.Crazy;

const counter = {
  setup() {
    const ref = vue.ref(0);

    vue.watch(ref, (n) => console.log(`Outside: ${n}`));

    return () => {
      const [count, setCount] = react.useState(ref.value);

      react.useEffect(() => console.log(`Inside: ${count}`), [count]);

      return fragment([
        div([`${ref.value}`, `${count}`]),
        button(['Outside'], {onClick: () => {ref.value += 1;}}),
        button(['Inside'], {onClick: () => setCount(count + 1)}),
      ]);
    };
  },
};

vue.createApp(h(counter)).mount(document.body);
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
