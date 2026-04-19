import type {
	GetRecipeResult,
	ListRecipesResult,
	RandomRecipesResult,
} from "$lib/types/backend";
import { api } from "./client";

export const recipesApi = {
	list(params?: {
		page?: number;
		limit?: number;
		query?: string;
		servings_min?: number;
		servings_max?: number;
		prep_time_min?: number;
		prep_time_max?: number;
	}) {
		return api.get<ListRecipesResult>("/recipes", {
			params: Object.fromEntries(
				Object.entries({
					page: params?.page,
					limit: params?.limit,
					query: params?.query,
					servings_min: params?.servings_min,
					servings_max: params?.servings_max,
					prep_time_min: params?.prep_time_min,
					prep_time_max: params?.prep_time_max,
				}).flatMap(([key, value]) =>
					value === undefined || value === null ? [] : [[key, String(value)]],
				),
			),
		});
	},

	get(recipe_id: string) {
		return api.get<GetRecipeResult>(`/recipes/${recipe_id}`);
	},

	random(params: {
		amount: number;
		country?: string;
		region?: string;
		preparation_time_minutes?: number;
		prep_time_min?: number;
		prep_time_max?: number;
	}) {
		return api.get<RandomRecipesResult>("/recipes/random", {
			params: Object.fromEntries(
				Object.entries({
					amount: params.amount,
					country: params.country,
					region: params.region,
					preparation_time_minutes: params.preparation_time_minutes,
					prep_time_min: params.prep_time_min,
					prep_time_max: params.prep_time_max,
				}).flatMap(([key, value]) =>
					value === undefined || value === null ? [] : [[key, String(value)]],
				),
			),
		});
	},
};
