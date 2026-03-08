export type PetSpecies = "dog" | "cat" | "bird" | "rabbit" | "other";
export type PetSex = "male" | "female";

export type PetDetails = {
	name: string;
	species: PetSpecies | "";
	sex: PetSex | "";
	birth_date: string;
	passing_date: string;
};

export type MediaItem = {
	id: string;
	file_name: string;
	file_size: number;
	file_type: string;
	order: number;
};

export type TributeData = {
	message: string;
};

export type MemorialDraft = {
	current_step: number;
	pet_details: PetDetails;
	media: MediaItem[];
	tribute: TributeData;
};

export type MemorialMediaUploadResponse = {
	id: string;
	url: string;
	thumbnail_url: string;
};

export type Memorial = {
	id: string;
	pet_details: PetDetails;
	media: MemorialMediaUploadResponse[];
	tribute: TributeData;
	user_id: string | null;
	anonymous_session_id: string | null;
	created_at: string;
};
