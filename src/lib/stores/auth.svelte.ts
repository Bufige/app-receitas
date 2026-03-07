import type { User } from "$lib/types/auth";

let currentUser = $state<User | null>(null);
const isAuthenticated = $derived(currentUser !== null);

export function useAuthStore() {
	return {
		get user() {
			return currentUser;
		},
		get isAuthenticated() {
			return isAuthenticated;
		},
		setUser(user: User | null) {
			currentUser = user;
		},
		clearUser() {
			currentUser = null;
			localStorage.removeItem("auth_token");
		},
	};
}
