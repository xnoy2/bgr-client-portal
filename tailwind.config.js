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
                    DEFAULT: '#25282D',
                    dark:    '#25282D',
                    darker:  '#000000',
                },
                gold: {
                    DEFAULT: '#B2945B',
                    dark:    '#9A7D47',
                },
                cream: {
                    DEFAULT: '#F1F1EF',
                    2:       '#E8E6E2',
                    3:       '#D1CDC7',
                },
            },
        },
    },

    plugins: [forms],
};
