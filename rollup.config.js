import { babel } from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import path from 'path';

const extensions = ['.mjs', '.js', '.ts', '.json', '.node'];
const opts = {
  plugins: [
    json(),
    alias({
      entries: [
        { find: '@', replacement: path.resolve(__dirname, 'src') },
        { find: '@test', replacement: path.resolve(__dirname, 'src/__tests__') },
      ],
    }),
    resolve({
      extensions,
    }),
    commonjs(),
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
    terser({
      mangle: true,
      compress: true,
    }),
  ],
};

export default [
  {
    input: path.resolve(__dirname, 'src/react/index.ts'),
    output: [
      {
        file: path.resolve(__dirname, 'dist/react.js'),
        format: 'umd',
        name: 'React',
        sourcemap: true,
      },
    ],
    ...opts,
  },
  {
    input: path.resolve(__dirname, 'src/vue/index.ts'),
    output: [
      {
        file: path.resolve(__dirname, 'dist/vue.js'),
        format: 'umd',
        name: 'Vue',
        sourcemap: true,
      },
    ],
    ...opts,
  },
];
