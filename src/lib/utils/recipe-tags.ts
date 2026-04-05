import type * as Messages from "$lib/paraglide/messages.js";

export function get_recipe_tag_label(
	tag: string,
	messages: typeof Messages,
): string {
	switch (tag) {
		case "pasta":
			return messages.recipes_tag_pasta();
		case "dinner":
			return messages.recipes_tag_dinner();
		case "family":
			return messages.recipes_tag_family();
		case "lunch":
			return messages.recipes_tag_lunch();
		case "quick":
			return messages.recipes_tag_quick();
		case "balanced":
			return messages.recipes_tag_balanced();
		case "soup":
			return messages.recipes_tag_soup();
		case "seasonal":
			return messages.recipes_tag_seasonal();
		default:
			return tag;
	}
}
