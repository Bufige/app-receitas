import type { LoginPayload, RegisterPayload, User } from "$lib/types/auth";
import type { RequestResponse } from "$lib/types/request";
import { api } from "./client";

export const authApi = {
	login(payload: LoginPayload) {
		return api.post<RequestResponse<{ token: string; user: User }>>(
			"/auth/login",
			payload,
		);
	},

	register(payload: RegisterPayload) {
		return api.post<RequestResponse<{ token: string; user: User }>>(
			"/auth/register",
			payload,
		);
	},

	logout() {
		return api.post<RequestResponse<null>>("/auth/logout");
	},

	me() {
		return api.get<RequestResponse<User>>("/auth/me");
	},
};
