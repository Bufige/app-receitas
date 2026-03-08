import { browser } from "$app/environment";
import type {
	MediaItem,
	MemorialDraft,
	PetDetails,
	TributeData,
} from "$lib/types/memorial";

const STORAGE_KEY = "memorial_draft";
const MAX_MEDIA = 20;

function defaultPetDetails(): PetDetails {
	return {
		name: "",
		species: "",
		sex: "",
		birth_date: "",
		passing_date: "",
	};
}

function defaultTribute(): TributeData {
	return { message: "" };
}

function defaultDraft(): MemorialDraft {
	return {
		current_step: 1,
		pet_details: defaultPetDetails(),
		media: [],
		tribute: defaultTribute(),
	};
}

function loadDraft(): MemorialDraft {
	if (!browser) return defaultDraft();
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return defaultDraft();
		const parsed = JSON.parse(stored) as MemorialDraft;
		return { ...defaultDraft(), ...parsed };
	} catch {
		return defaultDraft();
	}
}

function saveDraft(draft: MemorialDraft) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
	} catch {
		// localStorage full or unavailable — silently fail
	}
}

// In-memory file map (not serializable to localStorage)
const fileMap = new Map<string, File>();

let current_step = $state(1);
let pet_details = $state<PetDetails>(defaultPetDetails());
let media = $state<MediaItem[]>([]);
let tribute = $state<TributeData>(defaultTribute());
let initialized = $state(false);

function hydrateFromStorage() {
	if (initialized) return;
	const draft = loadDraft();
	current_step = draft.current_step;
	pet_details = draft.pet_details;
	media = draft.media;
	tribute = draft.tribute;
	initialized = true;
}

function persist() {
	saveDraft({
		current_step,
		pet_details,
		media,
		tribute,
	});
}

export function useMemorialDraft() {
	if (browser) {
		hydrateFromStorage();
	}

	return {
		get currentStep() {
			return current_step;
		},
		set currentStep(step: number) {
			current_step = step;
			persist();
		},

		get petDetails() {
			return pet_details;
		},
		updatePetDetails(updates: Partial<PetDetails>) {
			pet_details = { ...pet_details, ...updates };
			persist();
		},

		get media() {
			return media;
		},
		addMedia(file: File) {
			if (media.length >= MAX_MEDIA) return;
			const item: MediaItem = {
				id: crypto.randomUUID(),
				file_name: file.name,
				file_size: file.size,
				file_type: file.type,
				order: media.length,
			};
			fileMap.set(item.id, file);
			media = [...media, item];
			persist();
		},
		removeMedia(id: string) {
			fileMap.delete(id);
			media = media
				.filter((m) => m.id !== id)
				.map((m, i) => ({ ...m, order: i }));
			persist();
		},
		reorderMedia(fromIndex: number, toIndex: number) {
			const updated = [...media];
			const [moved] = updated.splice(fromIndex, 1);
			updated.splice(toIndex, 0, moved);
			media = updated.map((m, i) => ({ ...m, order: i }));
			persist();
		},
		getFile(id: string): File | undefined {
			return fileMap.get(id);
		},
		get maxMedia() {
			return MAX_MEDIA;
		},

		get tribute() {
			return tribute;
		},
		updateTribute(updates: Partial<TributeData>) {
			tribute = { ...tribute, ...updates };
			persist();
		},

		get isStep1Valid() {
			return pet_details.name.trim().length > 0 && pet_details.species !== "";
		},

		reset() {
			current_step = 1;
			pet_details = defaultPetDetails();
			media = [];
			tribute = defaultTribute();
			fileMap.clear();
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			initialized = false;
		},
	};
}
