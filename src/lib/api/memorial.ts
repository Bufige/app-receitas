import type {
	Memorial,
	MemorialDraft,
	MemorialMediaUploadResponse,
} from "$lib/types/memorial";
import type { RequestResponse } from "$lib/types/request";
import { api } from "./client";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const memorialApi = {
	async uploadMedia(
		file: File,
	): Promise<RequestResponse<MemorialMediaUploadResponse>> {
		const formData = new FormData();
		formData.append("file", file);

		const token =
			typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
		const anonSession =
			typeof window !== "undefined"
				? localStorage.getItem("anon_session_id")
				: null;

		const headers: Record<string, string> = {};
		if (token) headers.Authorization = `Bearer ${token}`;
		if (anonSession) headers["X-Anonymous-Session"] = anonSession;

		const response = await fetch(`${BASE_URL}/memorials/upload`, {
			method: "POST",
			headers,
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json().catch(() => null);
			throw new Error(error?.message ?? response.statusText);
		}

		return response.json();
	},

	create(draft: Omit<MemorialDraft, "current_step">) {
		return api.post<RequestResponse<Memorial>>("/memorials", draft);
	},
};
