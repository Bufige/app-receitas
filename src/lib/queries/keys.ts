export const queryKeys = {
	auth: {
		all: ["auth"] as const,
		me: () => [...queryKeys.auth.all, "me"] as const,
	},
	recipes: {
		all: ["recipes"] as const,
		list: (params?: { page?: number; limit?: number; query?: string }) =>
			[...queryKeys.recipes.all, "list", params ?? {}] as const,
		random: (params: {
			amount: number;
			country?: string;
			region?: string;
			prep_time_min?: number;
			prep_time_max?: number;
		}) => [...queryKeys.recipes.all, "random", params] as const,
		detail: (recipe_identifier: string) =>
			[...queryKeys.recipes.all, "detail", recipe_identifier] as const,
	},
} as const;
