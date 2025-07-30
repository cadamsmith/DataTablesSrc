export default [
  // ESM build
  {
    input: './src/index.js',
    output: {
      file: 'dist/datatables.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    external: ['jquery']
  },
  // UMD build
  {
    input: './src/index.js',
    output: {
      file: 'dist/datatables.umd.js',
      format: 'umd',
      name: 'DataTable',
      sourcemap: true,
      globals: {
        jquery: '$'
      }
    },
    external: ['jquery']
  },
];
