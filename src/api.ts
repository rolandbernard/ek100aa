/**
 * Represents a sample from the dataset.
 */
export interface Sample {
    /** Unique id within the system. */
    id: string;
    /** Start time of the action in seconds. */
    start: number;
    /** End time of the action in seconds. */
    end: number;
    /** Label describing the action. */
    label: string;
}

/**
 * This is a React hook that can be used to get quick search query suggestions.
 * The results are returned in no particular order, and the user should make sure
 * to order them appropriately.
 *
 * @param query The partial query for which we search suggested completions.
 * @returns A list of suggestions in arbitrary order. The list will incrementally
 *          update as new suggestions are received.
 */
export function useSuggestions(query: string) {
    const result: string[] = ["P01_42", "P42_01"];
    return result;
}

/**
 * React hook for retrieving a sample given it's unique identifier.
 *
 * @param id The id of the sample to retrieve.
 * @returns `null` if missing, and a `Sample` instance otherwise.
 */
export function useSample(id: string) {
    const result: Sample | null = null;
    return result;
}

/**
 * Returns a random sample id.
 *
 * @returns The id of a randomly selected sample.
 */
export function getRandom() {
    const result: string = "42";
    return result;
}
