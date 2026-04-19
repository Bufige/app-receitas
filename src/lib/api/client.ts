import type { RequestResponse } from "$lib/types/request";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

type RequestOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
	params?: Record<string, string>;
};

async function request<T>(
	endpoint: string,
	options: RequestOptions = {},
): Promise<T> {
	const { body, params, headers: customHeaders, ...rest } = options;

	const url = new URL(endpoint, BASE_URL);

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}
	}

	const headers = new Headers(customHeaders);

	if (body && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}

	const token =
		typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	const anonSession =
		typeof window !== "undefined"
			? localStorage.getItem("anon_session_id")
			: null;
	if (anonSession) {
		headers.set("X-Anonymous-Session", anonSession);
	}

	const response = await fetch(url, {
		...rest,
		credentials: "include",
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch(() => null)) as RequestResponse<null> | null;
		throw new ApiError(
			error?.message ?? response.statusText,
			response.status,
			error,
		);
	}

	return response.json() as Promise<T>;
}

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public response: RequestResponse<null> | null,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export const api = {
	get<T>(endpoint: string, options?: RequestOptions) {
		return request<T>(endpoint, { ...options, method: "GET" });
	},

	post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
		return request<T>(endpoint, { ...options, method: "POST", body });
	},

	put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
		return request<T>(endpoint, { ...options, method: "PUT", body });
	},

	patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
		return request<T>(endpoint, { ...options, method: "PATCH", body });
	},

	delete<T>(endpoint: string, options?: RequestOptions) {
		return request<T>(endpoint, { ...options, method: "DELETE" });
	},
};
