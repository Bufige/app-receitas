import type {
	CreateMealPlanPayload,
	CreateMealPlanResult,
	GetMealPlanResult,
	GetMealPlanShoppingListResult,
	ListMealPlansResult,
	UpdateMealPlanPayload,
	UpdateMealPlanResult,
} from "$lib/types/backend";
import type { RequestResponse } from "$lib/types/request";
import { api } from "./client";

function normalize_meal_plan_datetime(
	value: string | null | undefined,
	boundary: "start" | "end",
) {
	if (value === undefined || value === null || value.length === 0) {
		return value;
	}

	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return boundary === "start" ? `${value}T00:00:00Z` : `${value}T23:59:59Z`;
	}

	const parsed_date = new Date(value);

	if (Number.isNaN(parsed_date.getTime())) {
		return value;
	}

	return parsed_date.toISOString();
}

function normalize_meal_plan_payload<
	T extends CreateMealPlanPayload | UpdateMealPlanPayload,
>(payload: T): T {
	return {
		...payload,
		start_date: normalize_meal_plan_datetime(payload.start_date, "start"),
		end_date: normalize_meal_plan_datetime(payload.end_date, "end"),
	};
}

export const mealPlansApi = {
	list(profile_id?: string) {
		return api.get<ListMealPlansResult>("/meal-plans", {
			params: profile_id ? { profile_id } : undefined,
		});
	},

	get(meal_plan_id: string) {
		return api.get<GetMealPlanResult>(`/meal-plans/${meal_plan_id}`);
	},

	create(payload: CreateMealPlanPayload) {
		return api.post<CreateMealPlanResult>(
			"/meal-plans",
			normalize_meal_plan_payload(payload),
		);
	},

	update(meal_plan_id: string, payload: UpdateMealPlanPayload) {
		return api.put<UpdateMealPlanResult>(
			`/meal-plans/${meal_plan_id}`,
			normalize_meal_plan_payload(payload),
		);
	},

	delete(meal_plan_id: string) {
		return api.delete<RequestResponse<null>>(`/meal-plans/${meal_plan_id}`);
	},

	getShoppingList(meal_plan_id: string) {
		return api.get<GetMealPlanShoppingListResult>(
			`/meal-plans/${meal_plan_id}/shopping-list`,
		);
	},
};
