import type { Recipe } from "$lib/types/recipe";
import { parse_iso_date } from "$lib/utils/planning";
import { infer_recipe_location } from "$lib/utils/recipe-location";

function shuffle_recipes(recipes: Recipe[]): Recipe[] {
	const shuffled_recipes = [...recipes];

	for (let index = shuffled_recipes.length - 1; index > 0; index -= 1) {
		const random_index = Math.floor(Math.random() * (index + 1));
		const current_recipe = shuffled_recipes[index];
		shuffled_recipes[index] = shuffled_recipes[random_index];
		shuffled_recipes[random_index] = current_recipe;
	}

	return shuffled_recipes;
}

export function build_recipe_pool(
	recipes: Recipe[],
	timezone?: string,
): Recipe[] {
	const location = infer_recipe_location(timezone);
	const region_matches = recipes.filter(
		(recipe) =>
			recipe.country === location.country &&
			location.region !== undefined &&
			recipe.region === location.region,
	);
	const country_generic = recipes.filter(
		(recipe) =>
			recipe.country === location.country && recipe.region === undefined,
	);
	const country_fallback = recipes.filter(
		(recipe) =>
			recipe.country === location.country &&
			!region_matches.some((candidate) => candidate.id === recipe.id) &&
			!country_generic.some((candidate) => candidate.id === recipe.id),
	);

	return shuffle_recipes([
		...region_matches,
		...country_generic,
		...country_fallback,
	]);
}

export function collect_plan_dates(
	start_date?: string,
	end_date?: string,
	limit?: number,
): string[] {
	if (!start_date || !end_date || !limit || limit <= 0) {
		return [];
	}

	const dates: string[] = [];
	const current_date = parse_iso_date(start_date);
	const last_date = parse_iso_date(end_date);

	while (current_date <= last_date && dates.length < limit) {
		dates.push(current_date.toISOString().slice(0, 10));
		current_date.setDate(current_date.getDate() + 1);
	}

	return dates;
}
