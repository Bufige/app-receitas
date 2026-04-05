import { browser } from "$app/environment";
import {
	mock_household_profile,
	mock_household_profiles,
} from "$lib/mocks/household-profile";
import type { HouseholdKind, HouseholdProfile } from "$lib/types/planning";

const LEGACY_STORAGE_KEY = "household_profile";
const PROFILES_STORAGE_KEY = "household_profiles";
const ACTIVE_HOUSEHOLD_STORAGE_KEY = "active_household_id";

function clone_profile(profile: HouseholdProfile): HouseholdProfile {
	return JSON.parse(JSON.stringify(profile)) as HouseholdProfile;
}

function default_profiles(): HouseholdProfile[] {
	return mock_household_profiles.map((profile) => clone_profile(profile));
}

function default_profile(): HouseholdProfile {
	return clone_profile(mock_household_profile);
}

function default_active_household_id(
	profiles: HouseholdProfile[] = default_profiles(),
): string {
	return (
		profiles.find((profile) => profile.kind === "home")?.id ??
		profiles[0]?.id ??
		default_profile().id
	);
}

function get_active_household(
	profiles: HouseholdProfile[],
	active_household_id: string,
): HouseholdProfile {
	return (
		profiles.find((profile) => profile.id === active_household_id) ??
		profiles.find((profile) => profile.kind === "home") ??
		profiles[0] ??
		default_profile()
	);
}

function load_profiles(): HouseholdProfile[] {
	if (!browser) {
		return default_profiles();
	}

	try {
		const stored = localStorage.getItem(PROFILES_STORAGE_KEY);

		if (!stored) {
			const legacy_profile = localStorage.getItem(LEGACY_STORAGE_KEY);

			if (!legacy_profile) {
				return default_profiles();
			}

			return [
				{
					...default_profile(),
					...(JSON.parse(legacy_profile) as HouseholdProfile),
				},
				...default_profiles().slice(1),
			];
		}

		const parsed = JSON.parse(stored) as HouseholdProfile[];
		return parsed.length > 0 ? parsed : default_profiles();
	} catch {
		return default_profiles();
	}
}

function save_profiles(profiles: HouseholdProfile[]) {
	if (!browser) {
		return;
	}

	try {
		localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
	} catch {
		return;
	}
}

function load_active_household_id(profiles: HouseholdProfile[]): string {
	if (!browser) {
		return default_active_household_id(profiles);
	}

	try {
		const stored = localStorage.getItem(ACTIVE_HOUSEHOLD_STORAGE_KEY);

		if (stored && profiles.some((profile) => profile.id === stored)) {
			return stored;
		}

		return default_active_household_id(profiles);
	} catch {
		return default_active_household_id(profiles);
	}
}

function save_active_household_id(active_household_id: string) {
	if (!browser) {
		return;
	}

	try {
		localStorage.setItem(ACTIVE_HOUSEHOLD_STORAGE_KEY, active_household_id);
	} catch {
		return;
	}
}

function build_household_id(kind: HouseholdKind): string {
	return `household-${kind}-${crypto.randomUUID()}`;
}

function build_household_name(
	profiles: HouseholdProfile[],
	kind: HouseholdKind,
): string {
	const base_name = kind === "home" ? "Home" : "Business";
	const existing_count = profiles.filter(
		(profile) => profile.kind === kind,
	).length;

	return existing_count === 0
		? base_name
		: `${base_name} ${existing_count + 1}`;
}

function get_default_home_household_id(
	profiles: HouseholdProfile[],
): string | null {
	return profiles.find((profile) => profile.kind === "home")?.id ?? null;
}

let profiles = $state<HouseholdProfile[]>(default_profiles());
let active_household_id = $state(default_active_household_id());
let initialized = $state(false);

function hydrate() {
	if (!browser || initialized) {
		return;
	}

	profiles = load_profiles();
	active_household_id = load_active_household_id(profiles);
	initialized = true;
}

function persist() {
	save_profiles(profiles);
	save_active_household_id(active_household_id);
}

function is_removable_household(
	profile: HouseholdProfile,
	profiles: HouseholdProfile[],
): boolean {
	if (profile.kind === "business") {
		return true;
	}

	return get_default_home_household_id(profiles) !== profile.id;
}

export function useHouseholdProfileStore() {
	hydrate();

	return {
		get profiles() {
			return profiles;
		},
		get activeHouseholdId() {
			return get_active_household(profiles, active_household_id).id;
		},
		get profile() {
			return get_active_household(profiles, active_household_id);
		},
		canDeleteHousehold(household_id: string) {
			const target_household = profiles.find(
				(profile) => profile.id === household_id,
			);

			if (!target_household) {
				return false;
			}

			return is_removable_household(target_household, profiles);
		},
		selectHousehold(household_id: string) {
			if (!profiles.some((profile) => profile.id === household_id)) {
				return;
			}

			active_household_id = household_id;
			persist();
		},
		createHousehold(kind: HouseholdKind) {
			const next_household: HouseholdProfile = {
				id: build_household_id(kind),
				name: build_household_name(profiles, kind),
				kind,
				default_servings: kind === "business" ? 12 : 4,
				dietary_preferences: [],
				disliked_ingredients: [],
			};

			profiles = [...profiles, next_household];
			active_household_id = next_household.id;
			persist();
			return next_household;
		},
		update(
			updates: Partial<HouseholdProfile>,
			household_id = active_household_id,
		) {
			profiles = profiles.map((profile) =>
				profile.id === household_id ? { ...profile, ...updates } : profile,
			);
			persist();
		},
		deleteHousehold(household_id: string) {
			const target_household = profiles.find(
				(profile) => profile.id === household_id,
			);

			if (
				!target_household ||
				!is_removable_household(target_household, profiles)
			) {
				return false;
			}

			profiles = profiles.filter((profile) => profile.id !== household_id);

			if (active_household_id === household_id) {
				active_household_id = default_active_household_id(profiles);
			}

			persist();
			return true;
		},
		reset() {
			profiles = default_profiles();
			active_household_id = default_active_household_id(profiles);
			persist();
		},
	};
}
