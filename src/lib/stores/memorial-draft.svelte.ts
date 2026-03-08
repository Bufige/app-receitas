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
		birthDate: "",
		passingDate: "",
	};
}

function defaultTribute(): TributeData {
	return { message: "" };
}

function defaultDraft(): MemorialDraft {
	return {
		currentStep: 1,
		petDetails: defaultPetDetails(),
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

let currentStep = $state(1);
let petDetails = $state<PetDetails>(defaultPetDetails());
let media = $state<MediaItem[]>([]);
let tribute = $state<TributeData>(defaultTribute());
let initialized = $state(false);

function hydrateFromStorage() {
	if (initialized) return;
	const draft = loadDraft();
	currentStep = draft.currentStep;
	petDetails = draft.petDetails;
	media = draft.media;
	tribute = draft.tribute;
	initialized = true;
}

function persist() {
	saveDraft({
		currentStep,
		petDetails,
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
			return currentStep;
		},
		set currentStep(step: number) {
			currentStep = step;
			persist();
		},

		get petDetails() {
			return petDetails;
		},
		updatePetDetails(updates: Partial<PetDetails>) {
			petDetails = { ...petDetails, ...updates };
			persist();
		},

		get media() {
			return media;
		},
		addMedia(file: File) {
			if (media.length >= MAX_MEDIA) return;
			const item: MediaItem = {
				id: crypto.randomUUID(),
				fileName: file.name,
				fileSize: file.size,
				fileType: file.type,
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
			return petDetails.name.trim().length > 0 && petDetails.species !== "";
		},

		reset() {
			currentStep = 1;
			petDetails = defaultPetDetails();
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
