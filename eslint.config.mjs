import common from 'eslint-config-mahir/common';
import node from 'eslint-config-mahir/node';
import typescript from 'eslint-config-mahir/typescript';

/**
 * @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigArray}
 */
export default [
  ...common,
  ...node,
  ...typescript,
  {
    rules: {
      'no-console': [
        'error',
        {
          allow: ['error', 'info', 'warn'],
        },
      ],
      'id-length': 'off',
      '@typescript-eslint/member-ordering': 'off',
    },
  },
  {
    ignores: ['dist/', '.yarn'],
  },
];
