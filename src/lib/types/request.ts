export type RequestResponse<T> = {
	success: boolean;
	data: T;
	message: string;
};

export type RequestPaginatedResponse<T> = {
	success: boolean;
	data: T[];
	message: string;
	meta: {
		page: number;
		limit: number;
		total?: number;
	};
};
