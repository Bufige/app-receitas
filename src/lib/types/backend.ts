import type { RequestResponse } from "$lib/types/request";

export type BackendIngredientUnit =
	| "unit"
	| "g"
	| "kg"
	| "ml"
	| "l"
	| "cup"
	| "tbsp"
	| "tsp"
	| "can"
	| "box"
	| "pinch"
	| "envelope"
	| "package"
	| "pot"
	| "sachet"
	| "tablet"
	| "bunch";

export type BackendMealPeriod = "weekly" | "monthly";
export type BackendMealDayOfWeek =
	| "sunday"
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday";
export type BackendMealTime = "breakfast" | "lunch" | "dinner" | "snack";
export type BackendProfileType = "home" | "business";

export type BackendBaseEntity = {
	id: string;
	created_at?: string;
	updated_at?: string;
};

export type BackendIngredient = BackendBaseEntity & {
	name: string;
	category?: string;
	image_url?: string;
	description?: string;
};

export type BackendTag = BackendBaseEntity & {
	name: string;
};

export type BackendRecipeIngredient = BackendBaseEntity & {
	recipe_id: string;
	ingredient_id: string;
	quantity: number;
	unit: BackendIngredientUnit;
	ingredient?: BackendIngredient;
};

export type BackendRecipeTag = BackendBaseEntity & {
	recipe_id: string;
	tag_id: string;
	tag?: BackendTag;
};

export type BackendRecipe = BackendBaseEntity & {
	name: string;
	slug?: string;
	source_url?: string;
	description?: string;
	country?: string;
	region?: string;
	image_url?: string;
	servings: number;
	preparation_time_minutes: number;
	instructions?: string[];
	account_id?: string | null;
	ingredients?: BackendRecipeIngredient[];
	tags?: BackendRecipeTag[];
};

export type BackendProfile = BackendBaseEntity & {
	name: string;
	type?: BackendProfileType;
	default_serving?: number;
	ingredients_disliked?: string[];
	dietary_preferences?: string[];
	account_id?: string | null;
	guest_session_id?: string | null;
	expires_at?: string | null;
	claimed_at?: string | null;
};

export type BackendMealPlanRecipe = BackendBaseEntity & {
	meal_plan_id: string;
	recipe_id: string;
	meal_date: string;
	meal_time: BackendMealTime;
	servings: number;
	recipe?: BackendRecipe;
};

export type BackendMealPlan = BackendBaseEntity & {
	name: string;
	period?: BackendMealPeriod | null;
	start_date?: string | null;
	end_date?: string | null;
	account_id?: string | null;
	profile_id: string;
	profile?: BackendProfile;
	recipes?: BackendMealPlanRecipe[];
};

export type BackendMealPlanShoppingListItem = {
	ingredient_id: string;
	quantity: number;
	unit: BackendIngredientUnit;
	ingredient?: BackendIngredient;
};

export type ListRecipesResult = RequestResponse<BackendRecipe[]> & {
	meta?: {
		page?: number;
		limit?: number;
		total?: number;
	};
};

export type GetRecipeResult = RequestResponse<BackendRecipe>;
export type RandomRecipesResult = RequestResponse<BackendRecipe[]>;
export type ListMealPlansResult = RequestResponse<BackendMealPlan[]>;
export type GetMealPlanResult = RequestResponse<BackendMealPlan>;
export type CreateMealPlanResult = RequestResponse<BackendMealPlan>;
export type UpdateMealPlanResult = RequestResponse<BackendMealPlan>;
export type GetMealPlanShoppingListResult = RequestResponse<
	BackendMealPlanShoppingListItem[]
>;

export type CreateMealPlanPayload = {
	name: string;
	period?: BackendMealPeriod | null;
	start_date?: string | null;
	end_date?: string | null;
	profile_id?: string;
	recipes?: Array<{
		recipe_id: string;
		meal_date: string;
		meal_time: BackendMealTime;
		servings?: number;
	}>;
};

export type UpdateMealPlanPayload = {
	name?: string;
	period?: BackendMealPeriod | null;
	start_date?: string | null;
	end_date?: string | null;
	profile_id?: string;
	recipes?: Array<{
		recipe_id: string;
		meal_date: string;
		meal_time: BackendMealTime;
		servings?: number;
	}>;
};
