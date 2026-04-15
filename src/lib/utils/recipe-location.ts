import type { BrazilRegion } from "$lib/types/recipe";

export const brazil_region_by_timezone: Record<string, BrazilRegion> = {
	"America/Rio_Branco": "north",
	"America/Manaus": "north",
	"America/Porto_Velho": "north",
	"America/Boa_Vista": "north",
	"America/Belem": "north",
	"America/Araguaina": "north",
	"America/Fortaleza": "northeast",
	"America/Recife": "northeast",
	"America/Maceio": "northeast",
	"America/Bahia": "northeast",
	"America/Cuiaba": "midwest",
	"America/Campo_Grande": "midwest",
	"America/Brasilia": "midwest",
	"America/Sao_Paulo": "southeast",
	"America/Rio_de_Janeiro": "southeast",
	"America/Vitoria": "southeast",
	"America/Curitiba": "south",
};

export function infer_recipe_location(timezone?: string): {
	country: string;
	region?: BrazilRegion;
} {
	return {
		country: "Brazil",
		region: timezone ? brazil_region_by_timezone[timezone] : undefined,
	};
}
