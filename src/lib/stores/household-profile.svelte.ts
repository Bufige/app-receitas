import { browser } from "$app/environment";
import { mock_household_profile } from "$lib/mocks/household-profile";
import type { HouseholdProfile } from "$lib/types/planning";

const STORAGE_KEY = "household_profile";

function clone_profile(profile: HouseholdProfile): HouseholdProfile {
	return JSON.parse(JSON.stringify(profile)) as HouseholdProfile;
}

function default_profile(): HouseholdProfile {
	return clone_profile(mock_household_profile);
}

function load_profile(): HouseholdProfile {
	if (!browser) {
		return default_profile();
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);

		if (!stored) {
			return default_profile();
		}

		return {
			...default_profile(),
			...(JSON.parse(stored) as HouseholdProfile),
		};
	} catch {
		return default_profile();
	}
}

function save_profile(profile: HouseholdProfile) {
	if (!browser) {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
	} catch {
		return;
	}
}

let profile = $state<HouseholdProfile>(default_profile());
let initialized = $state(false);

function hydrate() {
	if (!browser || initialized) {
		return;
	}

	profile = load_profile();
	initialized = true;
}

function persist() {
	save_profile(profile);
}

export function useHouseholdProfileStore() {
	hydrate();

	return {
		get profile() {
			return profile;
		},
		update(updates: Partial<HouseholdProfile>) {
			profile = { ...profile, ...updates };
			persist();
		},
		reset() {
			profile = default_profile();
			persist();
		},
	};
}
