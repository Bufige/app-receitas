import type {
	BackendIngredientUnit,
	BackendMealDayOfWeek,
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
import { format_iso_date, parse_iso_date } from "$lib/utils/planning";

const day_index_by_name: Record<BackendMealDayOfWeek, number> = {
	sunday: 0,
	monday: 1,
	tuesday: 2,
	wednesday: 3,
	thursday: 4,
	friday: 5,
	saturday: 6,
};

const day_name_by_index: BackendMealDayOfWeek[] = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
];

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

function find_first_occurrence_date(
	start_date: string | undefined,
	end_date: string | undefined,
	day_of_week: BackendMealDayOfWeek,
): string {
	const start = parse_iso_date(start_date ?? format_iso_date(new Date()));
	const end = parse_iso_date(
		end_date ?? start_date ?? format_iso_date(new Date()),
	);
	const current = new Date(start.getTime());
	const target_index = day_index_by_name[day_of_week];

	while (current <= end) {
		if (current.getDay() === target_index) {
			return format_iso_date(current);
		}

		current.setDate(current.getDate() + 1);
	}

	return format_iso_date(start);
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
	return {
		id: recipe_slot.id,
		recipe_id: recipe_slot.recipe_id,
		date: find_first_occurrence_date(
			meal_plan.start_date ?? undefined,
			meal_plan.end_date ?? undefined,
			recipe_slot.day_of_week,
		),
		meal_type: recipe_slot.meal_time as MealType,
		servings: recipe_slot.servings,
		recurrence_rule:
			meal_plan.start_date && meal_plan.end_date
				? {
						frequency: "week",
						interval: 1,
						ends_on: meal_plan.end_date,
					}
				: undefined,
		series_id: recipe_slot.id,
	};
}

export function backend_meal_plan_to_ui_plan(
	meal_plan: BackendMealPlan,
): MealPlan {
	return {
		id: meal_plan.id,
		household_id: meal_plan.profile_id,
		name: meal_plan.name,
		period: normalize_period(meal_plan.period),
		planning_preset: infer_preset(meal_plan.period),
		start_date: meal_plan.start_date ?? undefined,
		end_date: meal_plan.end_date ?? undefined,
		entries:
			meal_plan.recipes?.map((recipe_slot: BackendMealPlanRecipe) =>
				backend_recipe_slot_to_entry(meal_plan, recipe_slot),
			) ?? [],
	};
}

export function ui_entry_to_backend_recipe_slot(entry: MealPlanEntry): {
	recipe_id: string;
	day_of_week: BackendMealDayOfWeek;
	meal_time: BackendMealTime;
	servings?: number;
} {
	const entry_date = parse_iso_date(entry.date);

	return {
		recipe_id: entry.recipe_id,
		day_of_week: day_name_by_index[entry_date.getDay()] ?? "monday",
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
		total_quantity: Math.round(item.quantity * 100) / 100,
		unit: normalize_unit(item.unit),
		category: item.ingredient?.category ?? "other",
	}));
}
