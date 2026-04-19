import { type CreateQueryOptions, createQuery } from "@tanstack/svelte-query";
import { recipesApi } from "$lib/api/recipes";
import type {
	BackendRecipe,
	ListRecipesResult,
	RandomRecipesResult,
} from "$lib/types/backend";
import { queryKeys } from "./keys";

export function createRecipesQuery(
	params?: {
		page?: number;
		limit?: number;
		query?: string;
	},
	options?: Partial<CreateQueryOptions<ListRecipesResult>>,
) {
	return createQuery(() => ({
		queryKey: queryKeys.recipes.list(params),
		queryFn: () => recipesApi.list(params),
		...options,
	}));
}

export function createRecipeQuery(
	recipe_id: () => string | undefined,
	options?: Partial<
		CreateQueryOptions<{
			success: boolean;
			data: BackendRecipe;
			message: string;
		}>
	>,
) {
	return createQuery(() => ({
		queryKey: queryKeys.recipes.detail(recipe_id() ?? ""),
		queryFn: () => recipesApi.get(recipe_id() ?? ""),
		enabled: Boolean(recipe_id()),
		...options,
	}));
}

export function createRandomRecipesQuery(
	params: () => {
		amount: number;
		country?: string;
		region?: string;
		prep_time_min?: number;
		prep_time_max?: number;
	} | null,
	options?: Partial<CreateQueryOptions<RandomRecipesResult>>,
) {
	return createQuery(() => ({
		queryKey: queryKeys.recipes.random(
			params() ?? {
				amount: 1,
			},
		),
		queryFn: () => recipesApi.random(params() ?? { amount: 1 }),
		enabled: Boolean(params()),
		...options,
	}));
}
