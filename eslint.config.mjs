import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        ignores: ['loadTests/**'],
    },
    pluginJs.configs.recommended,
];