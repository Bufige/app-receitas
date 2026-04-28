type RecipeListKeyParams = {
	page?: number;
	limit?: number;
	query?: string;
	tag_ids?: string[];
	servings_min?: number;
	servings_max?: number;
	prep_time_min?: number;
	prep_time_max?: number;
};

type RecipeInfiniteListKeyParams = Omit<RecipeListKeyParams, "page">;

type RecipeRandomKeyParams = {
	amount: number;
	country?: string;
	region?: string;
	prep_time_min?: number;
	prep_time_max?: number;
};

const auth_all = ["auth"] as const;
const recipes_all = ["recipes"] as const;

function auth_me() {
	return ["auth", "me"] as const;
}

function recipes_list(params?: RecipeListKeyParams) {
	return ["recipes", "list", params ?? {}] as const;
}

function recipes_tags(params?: { page?: number; limit?: number }) {
	return ["recipes", "tags", params ?? {}] as const;
}

function recipes_infinite_list(params?: RecipeInfiniteListKeyParams) {
	return ["recipes", "infinite-list", params ?? {}] as const;
}

function recipes_random(params: RecipeRandomKeyParams) {
	return ["recipes", "random", params] as const;
}

function recipes_detail(recipe_identifier: string) {
	return ["recipes", "detail", recipe_identifier] as const;
}

export const queryKeys = {
	auth: {
		all: auth_all,
		me: auth_me,
	},
	recipes: {
		all: recipes_all,
		list: recipes_list,
		tags: recipes_tags,
		infiniteList: recipes_infinite_list,
		random: recipes_random,
		detail: recipes_detail,
	},
} as const;
