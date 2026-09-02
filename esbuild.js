const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');
const isProduction = process.argv.includes('--production');

const entryPoints = {
  extension: 'src/extension.ts',
  'mcp/server': 'src/mcp/server.ts',
  'test/runTest': 'src/test/runTest.ts',
  'test/suite/index': 'src/test/suite/index.ts',
  'test/suite/watcher.test': 'src/test/suite/watcher.test.ts',
  'test/suite/parser.test': 'src/test/suite/parser.test.ts',
  'test/suite/chunking.test': 'src/test/suite/chunking.test.ts',
  'test/suite/hashingEmbeddingProvider.test': 'src/test/suite/hashingEmbeddingProvider.test.ts',
  'test/suite/vectorStore.test': 'src/test/suite/vectorStore.test.ts',
  'test/suite/migrationDiff.test': 'src/test/suite/migrationDiff.test.ts',
  'test/suite/typegen.test': 'src/test/suite/typegen.test.ts',
  'test/suite/relationshipGraph.test': 'src/test/suite/relationshipGraph.test.ts',
  'test/suite/schemaEngine.test': 'src/test/suite/schemaEngine.test.ts'
};

const buildOptions = {
  entryPoints,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: !isProduction,
  minify: isProduction,
  outdir: 'out',
  external: ['vscode', '@xenova/transformers']
};

async function build() {
  try {
    await esbuild.build(buildOptions);
    console.log('Build succeeded');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

if (isWatch) {
  esbuild.context(buildOptions).then((ctx) => ctx.watch()).catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  build();
}
