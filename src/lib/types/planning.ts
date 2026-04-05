import type { IngredientUnit } from "$lib/types/recipe";

export type MealPlanPeriod = "week" | "month";
export type PlanningPreset =
	| "this_week"
	| "next_week"
	| "this_month"
	| "custom_range";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type RecurrenceFrequency = "day" | "week" | "month" | "year";
export type ShoppingItemStatus =
	| "pending"
	| "bought"
	| "skipped"
	| "already_available";

export type RecurrenceRule = {
	frequency: RecurrenceFrequency;
	interval: number;
	ends_on?: string;
	occurrence_count?: number;
};

export type MealPlanEntry = {
	id: string;
	recipe_id: string;
	date: string;
	meal_type: MealType;
	servings: number;
	recurrence_rule?: RecurrenceRule;
	series_id?: string;
};

export type MealPlan = {
	id: string;
	name: string;
	period: MealPlanPeriod;
	planning_preset?: PlanningPreset;
	start_date?: string;
	end_date?: string;
	entries: MealPlanEntry[];
};

export type ExpandedMealPlanEntry = MealPlanEntry & {
	occurrence_date: string;
	source_entry_id: string;
};

export type ShoppingListItem = {
	ingredient_id: string;
	name: string;
	total_quantity: number;
	unit: IngredientUnit;
	category: string;
	status?: ShoppingItemStatus;
};

export type HouseholdProfile = {
	id: string;
	name: string;
	default_servings: number;
	dietary_preferences?: string[];
	disliked_ingredients?: string[];
};

export type ConflictWarning = {
	id: string;
	date: string;
	meal_type: MealType;
	entry_ids: string[];
};
