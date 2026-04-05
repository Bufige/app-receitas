import type { Recipe } from "$lib/types/recipe";

export const mock_recipes: Recipe[] = [
	{
		id: "recipe-spaghetti-bolognese",
		slug: "spaghetti-bolognese",
		name: "Spaghetti Bolognese",
		description: "Classic pasta dish with ground beef and tomato sauce.",
		image_url:
			"https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=1200",
		servings: 4,
		preparation_time_in_minutes: 45,
		tags: ["pasta", "dinner", "family"],
		ingredients: [
			{
				id: "ingredient-spaghetti",
				name: "Spaghetti",
				quantity: 500,
				unit: "g",
				category: "grains",
			},
			{
				id: "ingredient-ground-beef",
				name: "Ground beef",
				quantity: 400,
				unit: "g",
				category: "meat",
			},
			{
				id: "ingredient-tomato-sauce",
				name: "Tomato sauce",
				quantity: 300,
				unit: "ml",
				category: "canned",
			},
		],
		instructions: [
			{ step: 1, description: "Boil the spaghetti until al dente." },
			{ step: 2, description: "Cook the ground beef in a pan." },
			{ step: 3, description: "Add tomato sauce and simmer." },
			{ step: 4, description: "Combine and serve." },
		],
	},
	{
		id: "recipe-chicken-rice-bowl",
		slug: "chicken-rice-bowl",
		name: "Chicken Rice Bowl",
		description: "A balanced bowl with seasoned chicken, rice, and vegetables.",
		image_url:
			"https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=1200",
		servings: 2,
		preparation_time_in_minutes: 30,
		tags: ["lunch", "quick", "balanced"],
		ingredients: [
			{
				id: "ingredient-rice",
				name: "Rice",
				quantity: 300,
				unit: "g",
				category: "grains",
			},
			{
				id: "ingredient-chicken-breast",
				name: "Chicken breast",
				quantity: 300,
				unit: "g",
				category: "meat",
			},
			{
				id: "ingredient-broccoli",
				name: "Broccoli",
				quantity: 1,
				unit: "unit",
				category: "vegetables",
			},
		],
		instructions: [
			{ step: 1, description: "Cook the rice until tender." },
			{ step: 2, description: "Season and grill the chicken breast." },
			{ step: 3, description: "Steam the broccoli and assemble the bowl." },
		],
	},
	{
		id: "recipe-vegetable-soup",
		slug: "vegetable-soup",
		name: "Vegetable Soup",
		description: "Comforting soup with seasonal vegetables and herbs.",
		image_url:
			"https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=1200",
		servings: 4,
		preparation_time_in_minutes: 40,
		tags: ["soup", "dinner", "seasonal"],
		ingredients: [
			{
				id: "ingredient-carrot",
				name: "Carrot",
				quantity: 4,
				unit: "unit",
				category: "vegetables",
			},
			{
				id: "ingredient-potato",
				name: "Potato",
				quantity: 6,
				unit: "unit",
				category: "vegetables",
			},
			{
				id: "ingredient-vegetable-broth",
				name: "Vegetable broth",
				quantity: 2,
				unit: "l",
				category: "canned",
			},
		],
		instructions: [
			{ step: 1, description: "Chop the vegetables into small pieces." },
			{ step: 2, description: "Bring the broth to a boil." },
			{ step: 3, description: "Add vegetables and simmer until soft." },
		],
	},
];

export function get_recipe_by_slug(slug: string): Recipe | undefined {
	return mock_recipes.find((recipe) => recipe.slug === slug);
}

export function get_recipe_by_id(id: string): Recipe | undefined {
	return mock_recipes.find((recipe) => recipe.id === id);
}
