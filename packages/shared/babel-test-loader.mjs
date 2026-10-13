import { transformAsync } from '@babel/core';
import presetEnv from '@babel/preset-env';
import presetReact from '@babel/preset-react';

export async function load(url, context, nextLoad) {
  const isJavaScript = url.endsWith('.js') || url.endsWith('.jsx');
  const isSharedPackage = url.includes('/packages/shared/');

  if (!isJavaScript || !isSharedPackage) {
    return nextLoad(url, context);
  }

  const loaded = await nextLoad(url, { ...context, format: 'module' });
  const result = await transformAsync(loaded.source.toString(), {
    filename: url,
    sourceType: 'module',
    babelrc: false,
    configFile: false,
    presets: [
      [presetEnv, { targets: { node: 'current' }, modules: false }],
      [presetReact, { runtime: 'automatic' }]
    ],
    sourceMaps: 'inline'
  });

  return {
    format: 'module',
    source: result?.code ?? loaded.source,
    shortCircuit: true
  };
}
