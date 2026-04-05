import type { HouseholdProfile } from "$lib/types/planning";

export const mock_household_profiles: HouseholdProfile[] = [
	{
		id: "household-home-001",
		name: "Home",
		kind: "home",
		default_servings: 4,
		dietary_preferences: [],
		disliked_ingredients: [],
	},
	{
		id: "household-business-001",
		name: "Casa Bufige Bistro",
		kind: "business",
		default_servings: 12,
		dietary_preferences: [],
		disliked_ingredients: [],
	},
];

export const mock_household_profile: HouseholdProfile =
	mock_household_profiles[0];
