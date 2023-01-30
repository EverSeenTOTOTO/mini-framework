# mini-framework

A minimal implementation for React and Vue, for fun and personal learning.

For more information, read my post [here](https://github.com/EverSeenTOTOTO/frontend-interview/blob/main/Framework.md).

React:

```js
import React from './dist/react.js';

const { fragment, div, button, useState, useEffect, useRef } = React;

function Counter() {
  const [value, setValue] = useState(0);
  const prev = useRef(value);

  useEffect(() => {
    console.log(`oldValue: ${prevValue.current}, newValue: ${value}`);

    prev.current = value;
  }, [value]);

  return fragment([
    div(
      [`Count: ${value}`],
      {
        style: {
          width: 300,
          height: 50,
          color: 'blue'
        }
      }
    ),
    button(
      ['Click Me'],
      {
        onClick: () => setValue(value + 1)
      },
    ),
  ]);
}

React.render(Counter, document.getElementById("root"));
```

Vue:

```js
import Vue from './dist/vue.js';

const { fragment, div, button, ref, watch } = Vue;

const Counter = {
  setup() {
    const count = ref(0);

    watch(count, (newVal, oldVal) => {
      console.log(`oldValue: ${oldVal}, newValue: ${newVal}`);
    });

    return fragment([
      div(
        [`Count: ${count.value}`],
        {
          style: {
            width: 300,
            height: 50,
            color: 'blue'
          }
        }
      ),
      button(
        ['Click Me'],
        {
          onClick: () => { count.value += 1 }
        },
      ),
    ]);
  }
}

Vue.createApp(Counter).mount("#root");
```
