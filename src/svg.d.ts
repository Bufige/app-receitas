declare module "*.svg?component" {
	import type { SvelteComponent } from "svelte";
	const content: typeof SvelteComponent;
	export default content;
}

declare module "*.svg?src" {
	const content: string;
	export default content;
}

declare module "*.svg?url" {
	const content: string;
	export default content;
}

declare module "*.svg?dataurl" {
	const content: string;
	export default content;
}
