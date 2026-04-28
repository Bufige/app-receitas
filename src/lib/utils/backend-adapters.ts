import type {
	BackendIngredientUnit,
	BackendMealPeriod,
	BackendMealPlan,
	BackendMealPlanRecipe,
	BackendMealPlanShoppingListItem,
	BackendMealTime,
	BackendProfile,
	BackendRecipe,
} from "$lib/types/backend";
import type {
	HouseholdProfile,
	MealPlan,
	MealPlanEntry,
	MealType,
	ShoppingListItem,
} from "$lib/types/planning";
import type { IngredientUnit, Recipe } from "$lib/types/recipe";
import { parse_iso_date } from "$lib/utils/planning";

function normalize_backend_date(value?: string | null): string | undefined {
	if (!value) {
		return undefined;
	}

	return value.slice(0, 10);
}

function normalize_unit(unit: BackendIngredientUnit): IngredientUnit {
	if (unit === "g" || unit === "kg" || unit === "ml" || unit === "l") {
		return unit;
	}

	return "unit";
}

function normalize_period(
	period?: BackendMealPeriod | null,
): MealPlan["period"] {
	return period === "monthly" ? "month" : "week";
}

function infer_preset(
	period?: BackendMealPeriod | null,
): MealPlan["planning_preset"] {
	return period === "monthly" ? "this_month" : "this_week";
}

export function backend_recipe_to_ui_recipe(recipe: BackendRecipe): Recipe {
	return {
		id: recipe.id,
		slug: recipe.slug ?? recipe.id,
		name: recipe.name,
		description: recipe.description,
		image_url: recipe.image_url,
		country: recipe.country ?? "Brazil",
		region: (recipe.region as Recipe["region"]) ?? undefined,
		servings: recipe.servings,
		preparation_time_in_minutes: recipe.preparation_time_minutes,
		tags:
			recipe.tags
				?.map(
					(recipe_tag: NonNullable<BackendRecipe["tags"]>[number]) =>
						recipe_tag.tag?.name,
				)
				.filter((tag: string | undefined): tag is string => Boolean(tag)) ?? [],
		ingredients:
			recipe.ingredients?.map(
				(ingredient: NonNullable<BackendRecipe["ingredients"]>[number]) => ({
					id: ingredient.ingredient_id,
					name: ingredient.ingredient?.name ?? ingredient.ingredient_id,
					quantity: ingredient.quantity,
					unit: normalize_unit(ingredient.unit),
					category: ingredient.ingredient?.category ?? "other",
				}),
			) ?? [],
		instructions:
			recipe.instructions?.map((description: string, index: number) => ({
				step: index + 1,
				description,
			})) ?? [],
	};
}

export function backend_profile_to_household_profile(
	profile: BackendProfile,
): HouseholdProfile {
	return {
		id: profile.id,
		name: profile.name,
		kind: profile.type ?? "home",
		default_servings: profile.default_serving ?? 2,
		dietary_preferences: profile.dietary_preferences ?? [],
		disliked_ingredients: profile.ingredients_disliked ?? [],
	};
}

export function backend_recipe_slot_to_entry(
	meal_plan: Pick<BackendMealPlan, "start_date" | "end_date">,
	recipe_slot: BackendMealPlanRecipe,
): MealPlanEntry {
	const normalized_meal_date = normalize_backend_date(recipe_slot.meal_date);

	return {
		id: recipe_slot.id,
		recipe_id: recipe_slot.recipe_id,
		date:
			normalized_meal_date ??
			normalize_backend_date(meal_plan.start_date) ??
			normalize_backend_date(meal_plan.end_date) ??
			parse_iso_date(new Date().toISOString()).toISOString().slice(0, 10),
		meal_type: recipe_slot.meal_time as MealType,
		servings: recipe_slot.servings,
	};
}

export function backend_meal_plan_to_ui_plan(
	meal_plan: BackendMealPlan,
): MealPlan {
	const normalized_start_date = normalize_backend_date(meal_plan.start_date);
	const normalized_end_date = normalize_backend_date(meal_plan.end_date);

	return {
		id: meal_plan.id,
		household_id: meal_plan.profile_id,
		name: meal_plan.name,
		period: normalize_period(meal_plan.period),
		planning_preset: infer_preset(meal_plan.period),
		start_date: normalized_start_date,
		end_date: normalized_end_date,
		entries:
			meal_plan.recipes?.map((recipe_slot: BackendMealPlanRecipe) =>
				backend_recipe_slot_to_entry(meal_plan, recipe_slot),
			) ?? [],
	};
}

export function backend_meal_plan_to_ui_recipes(
	meal_plan: BackendMealPlan,
): Recipe[] {
	return (
		meal_plan.recipes
			?.map((recipe_slot: BackendMealPlanRecipe) => recipe_slot.recipe)
			.filter((recipe): recipe is BackendRecipe => Boolean(recipe))
			.map((recipe) => backend_recipe_to_ui_recipe(recipe)) ?? []
	);
}

export function backend_meal_plans_to_ui_recipes(
	meal_plans: BackendMealPlan[],
): Recipe[] {
	return meal_plans.flatMap((meal_plan) =>
		backend_meal_plan_to_ui_recipes(meal_plan),
	);
}

export function ui_entry_to_backend_recipe_slot(entry: MealPlanEntry): {
	recipe_id: string;
	meal_date: string;
	meal_time: BackendMealTime;
	servings?: number;
} {
	return {
		recipe_id: entry.recipe_id,
		meal_date: entry.date,
		meal_time: entry.meal_type,
		servings: entry.servings,
	};
}

export function backend_shopping_list_to_ui_items(
	items: BackendMealPlanShoppingListItem[],
): ShoppingListItem[] {
	return items.map((item) => ({
		ingredient_id: item.ingredient_id,
		name: item.ingredient?.name ?? item.ingredient_id,
		total_quantity: item.quantity,
		unit: normalize_unit(item.unit),
		category: item.ingredient?.category ?? "other",
	}));
}
