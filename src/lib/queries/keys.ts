export const queryKeys = {
	auth: {
		all: ["auth"] as const,
		me: () => [...queryKeys.auth.all, "me"] as const,
	},
	memorial: {
		all: ["memorial"] as const,
		detail: (id: string) => [...queryKeys.memorial.all, id] as const,
	},
} as const;
