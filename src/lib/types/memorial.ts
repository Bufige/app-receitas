export type PetSpecies = "dog" | "cat" | "bird" | "rabbit" | "other";
export type PetSex = "male" | "female";

export type PetDetails = {
	name: string;
	species: PetSpecies | "";
	sex: PetSex | "";
	birthDate: string;
	passingDate: string;
};

export type MediaItem = {
	id: string;
	fileName: string;
	fileSize: number;
	fileType: string;
	order: number;
};

export type TributeData = {
	message: string;
};

export type MemorialDraft = {
	currentStep: number;
	petDetails: PetDetails;
	media: MediaItem[];
	tribute: TributeData;
};

export type MemorialMediaUploadResponse = {
	id: string;
	url: string;
	thumbnailUrl: string;
};

export type Memorial = {
	id: string;
	petDetails: PetDetails;
	media: MemorialMediaUploadResponse[];
	tribute: TributeData;
	userId: string | null;
	anonymousSessionId: string | null;
	createdAt: string;
};
