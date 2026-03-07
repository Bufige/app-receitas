import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import svg from '@poppanator/sveltekit-svg';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-vercel';

export default defineConfig({
	plugins: [
		sveltekit(),
		svg({ type: 'component' }),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'cookie', 'baseLocale'],
		})
	]
});
