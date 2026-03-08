import {
	createMutation,
	useQueryClient,
} from "@tanstack/svelte-query";
import { memorialApi } from "$lib/api/memorial";
import type {
	MemorialDraft,
} from "$lib/types/memorial";
import { queryKeys } from "./
export function createUploadMediaMutation() {
	return createMutation(() => ({
		mutationFn: (file: File) => memorialApi.uploadMedia(file),
	}));
}

export function createMemorialMutation() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: (draft: Omit<MemorialDraft, "current_step">) =>
			memorialApi.create(draft),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.memorial.all,
			});
		},
	}));
}
