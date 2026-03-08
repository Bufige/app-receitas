import {
	type CreateQueryOptions,
	createMutation,
	createQuery,
	useQueryClient,
} from "@tanstack/svelte-query";
import { authApi } from "$lib/api/auth";
import { useAnonymousSession } from "$lib/stores/anonymous-session.svelte";
import type { LoginPayload, RegisterPayload, User } from "$lib/types/auth";
import type { RequestResponse } from "$lib/types/request";
import { queryKeys } from "./keys";

export function createMeQuery(
	options?: Partial<CreateQueryOptions<RequestResponse<User>>>,
) {
	return createQuery(() => ({
		queryKey: queryKeys.auth.me(),
		queryFn: () => authApi.me(),
		...options,
	}));
}

export function createLoginMutation() {
	const queryClient = useQueryClient();
	const anonSession = useAnonymousSession();

	return createMutation(() => ({
		mutationFn: (payload: LoginPayload) => authApi.login(payload),
		onSuccess: async (data) => {
			localStorage.setItem("auth_token", data.data.token);
			queryClient.setQueryData(queryKeys.auth.me(), {
				success: true,
				data: data.data.user,
				message: "ok",
			});
			if (anonSession.sessionId) {
				await authApi.claimSession(anonSession.sessionId).catch(() => {});
				anonSession.clear();
			}
		},
	}));
}

export function createRegisterMutation() {
	const queryClient = useQueryClient();
	const anonSession = useAnonymousSession();

	return createMutation(() => ({
		mutationFn: (payload: RegisterPayload) => authApi.register(payload),
		onSuccess: async (data) => {
			localStorage.setItem("auth_token", data.data.token);
			queryClient.setQueryData(queryKeys.auth.me(), {
				success: true,
				data: data.data.user,
				message: "ok",
			});
			if (anonSession.sessionId) {
				await authApi.claimSession(anonSession.sessionId).catch(() => {});
				anonSession.clear();
			}
		},
	}));
}

export function createLogoutMutation() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: () => authApi.logout(),
		onSuccess: () => {
			localStorage.removeItem("auth_token");
			queryClient.setQueryData(queryKeys.auth.me(), null);
			queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
		},
	}));
}
