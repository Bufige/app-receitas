import type {
	ConflictWarning,
	ExpandedMealPlanEntry,
	MealPlan,
	MealPlanEntry,
	PlanningPreset,
	RecurrenceRule,
} from "$lib/types/planning";

const MAX_EXPANDED_OCCURRENCES = 500;

function clone_date(date: Date): Date {
	return new Date(date.getTime());
}

export function parse_iso_date(value: string): Date {
	return new Date(`${value}T12:00:00`);
}

export function format_iso_date(date: Date): string {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function get_start_of_week(date: Date): Date {
	const current = clone_date(date);
	const day = current.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	current.setDate(current.getDate() + diff);
	return current;
}

function get_end_of_week(date: Date): Date {
	const start = get_start_of_week(date);
	const end = clone_date(start);
	end.setDate(end.getDate() + 6);
	return end;
}

function get_start_of_month(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function get_end_of_month(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
}

function add_interval(date: Date, recurrence_rule: RecurrenceRule): Date {
	const next_date = clone_date(date);

	switch (recurrence_rule.frequency) {
		case "day":
			next_date.setDate(next_date.getDate() + recurrence_rule.interval);
			break;
		case "week":
			next_date.setDate(next_date.getDate() + 7 * recurrence_rule.interval);
			break;
		case "month":
			next_date.setMonth(next_date.getMonth() + recurrence_rule.interval);
			break;
		case "year":
			next_date.setFullYear(next_date.getFullYear() + recurrence_rule.interval);
			break;
	}

	return next_date;
}

export function get_preset_range(
	preset: PlanningPreset,
	reference_date = new Date(),
): { start_date: string; end_date: string } {
	const normalized_reference = new Date(
		reference_date.getFullYear(),
		reference_date.getMonth(),
		reference_date.getDate(),
		12,
	);

	switch (preset) {
		case "this_week": {
			return {
				start_date: format_iso_date(get_start_of_week(normalized_reference)),
				end_date: format_iso_date(get_end_of_week(normalized_reference)),
			};
		}
		case "next_week": {
			const next_week_reference = clone_date(normalized_reference);
			next_week_reference.setDate(next_week_reference.getDate() + 7);
			return {
				start_date: format_iso_date(get_start_of_week(next_week_reference)),
				end_date: format_iso_date(get_end_of_week(next_week_reference)),
			};
		}
		case "this_month": {
			return {
				start_date: format_iso_date(get_start_of_month(normalized_reference)),
				end_date: format_iso_date(get_end_of_month(normalized_reference)),
			};
		}
		default:
			return {
				start_date: format_iso_date(normalized_reference),
				end_date: format_iso_date(normalized_reference),
			};
	}
}

export function format_plan_range_label(plan: {
	start_date?: MealPlan["start_date"];
	end_date?: MealPlan["end_date"];
}): string {
	if (!plan.start_date && !plan.end_date) {
		return "—";
	}

	if (!plan.start_date || !plan.end_date || plan.start_date === plan.end_date) {
		return plan.start_date ?? plan.end_date ?? "—";
	}

	return `${plan.start_date} → ${plan.end_date}`;
}

export function format_plan_selection_label(plan: {
	id: MealPlan["id"];
	name: MealPlan["name"];
	start_date?: MealPlan["start_date"];
	end_date?: MealPlan["end_date"];
}): string {
	return `${plan.name} · ${format_plan_range_label(plan)} · ${plan.id}`;
}

export function expand_meal_plan_entries(
	entries: MealPlanEntry[],
	start_date?: string,
	end_date?: string,
): ExpandedMealPlanEntry[] {
	const expanded_entries: ExpandedMealPlanEntry[] = [];
	const range_start = start_date ? parse_iso_date(start_date) : undefined;
	const range_end = end_date ? parse_iso_date(end_date) : undefined;

	for (const entry of entries) {
		const initial_date = parse_iso_date(entry.date);
		const should_include_single =
			(!range_start || initial_date >= range_start) &&
			(!range_end || initial_date <= range_end);

		if (!entry.recurrence_rule) {
			if (should_include_single) {
				expanded_entries.push({
					...entry,
					occurrence_date: entry.date,
					source_entry_id: entry.id,
				});
			}
			continue;
		}

		let current_date = initial_date;
		let occurrence_index = 0;
		const recurrence_end = entry.recurrence_rule.ends_on
			? parse_iso_date(entry.recurrence_rule.ends_on)
			: undefined;

		while (occurrence_index < MAX_EXPANDED_OCCURRENCES) {
			const is_after_range = range_end ? current_date > range_end : false;
			const is_after_recurrence_end = recurrence_end
				? current_date > recurrence_end
				: false;
			const reached_count_limit = entry.recurrence_rule.occurrence_count
				? occurrence_index >= entry.recurrence_rule.occurrence_count
				: false;

			if (is_after_range || is_after_recurrence_end || reached_count_limit) {
				break;
			}

			if (
				(!range_start || current_date >= range_start) &&
				(!range_end || current_date <= range_end)
			) {
				expanded_entries.push({
					...entry,
					occurrence_date: format_iso_date(current_date),
					source_entry_id: entry.id,
				});
			}

			current_date = add_interval(current_date, entry.recurrence_rule);
			occurrence_index += 1;
		}
	}

	return expanded_entries.sort((first, second) => {
		if (first.occurrence_date === second.occurrence_date) {
			return first.meal_type.localeCompare(second.meal_type);
		}

		return first.occurrence_date.localeCompare(second.occurrence_date);
	});
}

export function detect_meal_plan_conflicts(
	entries: MealPlanEntry[],
	start_date?: string,
	end_date?: string,
): ConflictWarning[] {
	const expanded_entries = expand_meal_plan_entries(
		entries,
		start_date,
		end_date,
	);
	const buckets = new Map<string, ExpandedMealPlanEntry[]>();

	for (const entry of expanded_entries) {
		const key = `${entry.occurrence_date}:${entry.meal_type}`;
		const current_bucket = buckets.get(key) ?? [];
		current_bucket.push(entry);
		buckets.set(key, current_bucket);
	}

	return [...buckets.entries()]
		.filter(([, bucket]) => bucket.length > 1)
		.map(([key, bucket]) => {
			const [date] = key.split(":");

			return {
				id: key,
				date,
				meal_type: bucket[0].meal_type,
				entry_ids: bucket.map((entry) => entry.id),
			};
		});
}
