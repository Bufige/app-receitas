export type IngredientUnit = "g" | "kg" | "ml" | "l" | "unit";

export type RecipeIngredient = {
	id: string;
	name: string;
	quantity: number;
	unit: IngredientUnit;
	category: string;
};

export type RecipeInstruction = {
	step: number;
	description: string;
};

export type Recipe = {
	id: string;
	slug: string;
	name: string;
	description?: string;
	image_url?: string;
	servings: number;
	preparation_time_in_minutes: number;
	tags?: string[];
	ingredients: RecipeIngredient[];
	instructions: RecipeInstruction[];
};
