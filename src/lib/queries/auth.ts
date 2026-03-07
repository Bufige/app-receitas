import { authApi } from "$lib/api/auth";
import type { LoginPayload, RegisterPayload, User } from "$lib/types/auth";
import type { RequestResponse } from "$lib/types/request";
import {
	createMutation,
	createQuery,
	useQueryClient,
	type CreateQueryOptions,
} from "@tanstack/svelte-query";
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

	return createMutation(() => ({
		mutationFn: (payload: LoginPayload) => authApi.login(payload),
		onSuccess: (data) => {
			localStorage.setItem("auth_token", data.data.token);
			queryClient.setQueryData(queryKeys.auth.me(), {
				success: true,
				data: data.data.user,
				message: "ok",
			});
		},
	}));
}

export function createRegisterMutation() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: (payload: RegisterPayload) => authApi.register(payload),
		onSuccess: (data) => {
			localStorage.setItem("auth_token", data.data.token);
			queryClient.setQueryData(queryKeys.auth.me(), {
				success: true,
				data: data.data.user,
				message: "ok",
			});
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
