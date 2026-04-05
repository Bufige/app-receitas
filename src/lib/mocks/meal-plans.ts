import type { MealPlan } from "$lib/types/planning";

export const mock_meal_plans: MealPlan[] = [
	{
		id: "meal-plan-week-001",
		name: "Weekly Family Plan",
		period: "week",
		planning_preset: "this_week",
		start_date: "2026-04-06",
		end_date: "2026-04-12",
		entries: [
			{
				id: "entry-001",
				recipe_id: "recipe-spaghetti-bolognese",
				date: "2026-04-06",
				meal_type: "dinner",
				servings: 4,
			},
			{
				id: "entry-002",
				recipe_id: "recipe-spaghetti-bolognese",
				date: "2026-04-09",
				meal_type: "lunch",
				servings: 2,
				series_id: "series-001",
				recurrence_rule: {
					frequency: "week",
					interval: 1,
					ends_on: "2026-06-25",
				},
			},
		],
	},
	{
		id: "meal-plan-week-002",
		name: "Balanced Midweek Plan",
		period: "week",
		planning_preset: "this_week",
		start_date: "2026-03-23",
		end_date: "2026-03-29",
		entries: [
			{
				id: "entry-101",
				recipe_id: "recipe-chicken-rice-bowl",
				date: "2026-03-23",
				meal_type: "lunch",
				servings: 2,
			},
			{
				id: "entry-102",
				recipe_id: "recipe-vegetable-soup",
				date: "2026-03-24",
				meal_type: "dinner",
				servings: 4,
				series_id: "series-101",
				recurrence_rule: {
					frequency: "week",
					interval: 1,
					occurrence_count: 3,
				},
			},
			{
				id: "entry-103",
				recipe_id: "recipe-spaghetti-bolognese",
				date: "2026-03-27",
				meal_type: "dinner",
				servings: 4,
			},
		],
	},
	{
		id: "meal-plan-month-001",
		name: "Seasonal Soup Rotation",
		period: "month",
		planning_preset: "this_month",
		start_date: "2026-02-01",
		end_date: "2026-02-28",
		entries: [
			{
				id: "entry-201",
				recipe_id: "recipe-vegetable-soup",
				date: "2026-02-02",
				meal_type: "dinner",
				servings: 4,
				series_id: "series-201",
				recurrence_rule: {
					frequency: "week",
					interval: 1,
					ends_on: "2026-02-23",
				},
			},
			{
				id: "entry-202",
				recipe_id: "recipe-chicken-rice-bowl",
				date: "2026-02-06",
				meal_type: "lunch",
				servings: 3,
			},
			{
				id: "entry-203",
				recipe_id: "recipe-spaghetti-bolognese",
				date: "2026-02-14",
				meal_type: "dinner",
				servings: 5,
			},
		],
	},
];
