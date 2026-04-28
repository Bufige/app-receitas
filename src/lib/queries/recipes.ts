import {
	type CreateInfiniteQueryOptions,
	type CreateQueryOptions,
	createInfiniteQuery,
	createQuery,
	type InfiniteData,
} from "@tanstack/svelte-query";
import { recipesApi } from "$lib/api/recipes";
import type {
	BackendRecipe,
	ListRecipesResult,
	RandomRecipesResult,
} from "$lib/types/backend";
import { queryKeys } from "./keys";

export type RecipesListParams = {
	page?: number;
	limit?: number;
	query?: string;
	servings_min?: number;
	servings_max?: number;
	prep_time_min?: number;
	prep_time_max?: number;
};

export function createRecipesQuery(
	params?: RecipesListParams,
	options?: Partial<CreateQueryOptions<ListRecipesResult>>,
) {
	return createQuery(() => ({
		queryKey: queryKeys.recipes.list(params),
		queryFn: () => recipesApi.list(params),
		...options,
	}));
}

export function createInfiniteRecipesQuery(
	params: () => Omit<RecipesListParams, "page">,
	options?: Partial<
		CreateInfiniteQueryOptions<
			ListRecipesResult,
			Error,
			InfiniteData<ListRecipesResult, number>,
			ReturnType<typeof queryKeys.recipes.infiniteList>,
			number
		>
	>,
) {
	return createInfiniteQuery(() => {
		const current_params = params();
		const limit = current_params.limit ?? 12;

		return {
			queryKey: queryKeys.recipes.infiniteList(current_params),
			initialPageParam: 0,
			queryFn: ({ pageParam }) =>
				recipesApi.list({
					...current_params,
					page: pageParam,
					limit,
				}),
			getNextPageParam: (last_page, all_pages) => {
				const limit_from_response = last_page.meta?.limit ?? limit;
				const total = last_page.meta?.total;
				const loaded_items = all_pages.reduce(
					(count, page) => count + page.data.length,
					0,
				);

				if (typeof total === "number") {
					return loaded_items < total ? all_pages.length : undefined;
				}

				return last_page.data.length >= limit_from_response
					? all_pages.length
					: undefined;
			},
			...options,
		};
	});
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
