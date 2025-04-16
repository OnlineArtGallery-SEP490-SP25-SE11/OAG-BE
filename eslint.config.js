import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.node
			},
			parserOptions: {
				project: './tsconfig.json',
				sourceType: 'module'
			}
		},
		rules: {
			'no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'off',
			'no-console': 'warn'
		}
	},
	{
		ignores: ['dist/', 'build/', 'node_modules/']
	}
];
