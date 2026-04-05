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
		id: "recipe-sheet-pan-salmon",
		slug: "sheet-pan-salmon",
		name: "Sheet Pan Salmon",
		description: "Oven-roasted salmon with potatoes, asparagus, and lemon.",
		image_url:
			"https://images.pexels.com/photos/32962795/pexels-photo-32962795.jpeg?auto=compress&cs=tinysrgb&w=1200",
		servings: 4,
		preparation_time_in_minutes: 35,
		tags: ["dinner", "quick", "balanced"],
		ingredients: [
			{
				id: "ingredient-salmon-fillet",
				name: "Salmon fillet",
				quantity: 600,
				unit: "g",
				category: "seafood",
			},
			{
				id: "ingredient-asparagus",
				name: "Asparagus",
				quantity: 1,
				unit: "unit",
				category: "vegetables",
			},
			{
				id: "ingredient-baby-potatoes",
				name: "Baby potatoes",
				quantity: 700,
				unit: "g",
				category: "vegetables",
			},
			{
				id: "ingredient-lemon",
				name: "Lemon",
				quantity: 2,
				unit: "unit",
				category: "fruit",
			},
		],
		instructions: [
			{ step: 1, description: "Heat the oven and season the salmon." },
			{ step: 2, description: "Roast the potatoes until nearly tender." },
			{ step: 3, description: "Add salmon, asparagus, and lemon to the tray." },
			{ step: 4, description: "Bake until the salmon is flaky and serve." },
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
		id: "recipe-chickpea-salad",
		slug: "chickpea-salad",
		name: "Mediterranean Chickpea Salad",
		description: "A fresh salad with chickpeas, cucumber, tomato, and feta.",
		image_url:
			"https://images.pexels.com/photos/257816/pexels-photo-257816.jpeg?auto=compress&cs=tinysrgb&w=1200",
		servings: 3,
		preparation_time_in_minutes: 20,
		tags: ["lunch", "quick", "balanced"],
		ingredients: [
			{
				id: "ingredient-chickpeas",
				name: "Chickpeas",
				quantity: 400,
				unit: "g",
				category: "canned",
			},
			{
				id: "ingredient-cucumber",
				name: "Cucumber",
				quantity: 1,
				unit: "unit",
				category: "vegetables",
			},
			{
				id: "ingredient-cherry-tomatoes",
				name: "Cherry tomatoes",
				quantity: 250,
				unit: "g",
				category: "vegetables",
			},
			{
				id: "ingredient-feta",
				name: "Feta cheese",
				quantity: 150,
				unit: "g",
				category: "dairy",
			},
		],
		instructions: [
			{ step: 1, description: "Drain the chickpeas and rinse well." },
			{ step: 2, description: "Dice the cucumber and halve the tomatoes." },
			{
				step: 3,
				description: "Toss everything together with the feta and serve.",
			},
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
	{
		id: "recipe-berry-yogurt-parfait",
		slug: "berry-yogurt-parfait",
		name: "Berry Yogurt Parfait",
		description: "Layered yogurt, berries, and granola for a quick breakfast.",
		image_url:
			"https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=1200",
		servings: 2,
		preparation_time_in_minutes: 10,
		tags: ["breakfast", "quick", "family"],
		ingredients: [
			{
				id: "ingredient-greek-yogurt",
				name: "Greek yogurt",
				quantity: 400,
				unit: "g",
				category: "dairy",
			},
			{
				id: "ingredient-mixed-berries",
				name: "Mixed berries",
				quantity: 250,
				unit: "g",
				category: "fruit",
			},
			{
				id: "ingredient-granola",
				name: "Granola",
				quantity: 150,
				unit: "g",
				category: "bakery",
			},
		],
		instructions: [
			{ step: 1, description: "Spoon yogurt into glasses or bowls." },
			{
				step: 2,
				description: "Add berries and granola in alternating layers.",
			},
			{
				step: 3,
				description: "Serve immediately while the granola stays crisp.",
			},
		],
	},
];

export function get_recipe_by_slug(slug: string): Recipe | undefined {
	return mock_recipes.find((recipe) => recipe.slug === slug);
}

export function get_recipe_by_id(id: string): Recipe | undefined {
	return mock_recipes.find((recipe) => recipe.id === id);
}
