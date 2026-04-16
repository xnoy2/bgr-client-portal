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
                    DEFAULT: '#1a3c2e',
                    dark:    '#142e23',
                    darker:  '#0e2019',
                },
                gold: {
                    DEFAULT: '#c9a84c',
                    dark:    '#b8943c',
                },
                cream: {
                    DEFAULT: '#f5f0e8',
                    2:       '#ede8df',
                    3:       '#e4ddd2',
                },
            },
        },
    },

    plugins: [forms],
};
