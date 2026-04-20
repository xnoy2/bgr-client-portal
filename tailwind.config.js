import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
                serif: ['Georgia', ...defaultTheme.fontFamily.serif],
            },
            colors: {
                forest: {
                    DEFAULT: '#121417',
                    dark:    '#0e1012',
                    darker:  '#080a0c',
                },
                gold: {
                    DEFAULT: '#888480',
                    dark:    '#6b6b6b',
                },
                cream: {
                    DEFAULT: '#F9F8F6',
                    2:       '#F0EDEA',
                    3:       '#D1CDC7',
                },
            },
        },
    },

    plugins: [forms],
};
