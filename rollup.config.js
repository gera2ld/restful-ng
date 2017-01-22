import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  dest: 'lib/index.js',
  format: 'umd',
  plugins: [babel({
    exclude: 'node_modules/**',
  })],
}
