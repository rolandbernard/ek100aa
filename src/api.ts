import { useEffect, useState } from "react";
import { useStateWithDep } from "./hooks";
import { NruCache } from "./util";

/**
 * Represents a document that is stored in the information retrieval system.
 * Note that this is the same structure as is stored on disk in JSON format
 * on the API server.
 */
export interface Doc {
    /** Unique id within the system. */
    id: number;
    /** Metadata about the document. */
    meta?: DocMeta;
    /** The title of the document. */
    title: string;
    /** The abstract of the document. */
    abstract?: DocPart[];
    /** The main body od the document. */
    body?: DocPart[];
    /** The back matter of the document. */
    back?: DocPart[];
    /** A map from citation id to the bibliography entry. */
    bib?: Record<string, DocBib>;
    /** A map from reference id to the content (table or figure). */
    ref?: Record<string, DocRef>;
}
/** Contains the metadata of a document. */
export interface DocMeta {
    /** DOI identifier of the document. Prepend `https://doi.org/` to get a valid URL. */
    doi?: string;
    /** A list of URL under with the document is accessible. */
    urls?: string[];
    /** The date of publication of the document. */
    date?: string;
    /** The journal in which the document was published. */
    journal?: string;
    /** The authors of the document. */
    authors?: DocAuthor[];
    /** The most permissive license under which the document is available. */
    license?: string;
}
/** Information about an author. */
export interface DocAuthor {
    /** The name of the author, in `Last, First M.` format. */
    name: string;
    /** The email of the author. */
    email?: string;
    /** The affiliation of the author. */
    affiliation?: string;
}
/** A segment of the text of the document. */
export interface DocPart {
    /** The text of this segment. */
    text: string;
    /**
     * The section under which the part falls. This is a list of strings with
     * the innermost one is the "smallest" header, and the outer most one the
     * "largest", e.g., `["Decision Making", "Qualitative Analysis", "Evaluation"]`.
     */
    section?: string[];
    /** This is a list if citations that appear somewhere in `text`. */
    cite?: DocCite[];
    /** Like `cites` but for references to tables or figures. */
    refs?: DocCite[];
}
/** Contains the location of a citation or reference. */
export interface DocCite {
    /** Offset into the text segment where the reference begins. */
    start: number;
    /** Offset into the text segment where the reference ends. */
    end: number;
    /** The id, either into `bibs` or `refs` that is referenced. */
    ref: string;
}
/** Information for a bibliography entry. */
export interface DocBib {
    /** The DOI identifier of the cited work. */
    doi?: string;
    /** Year of publication. */
    year?: number;
    /** Venue in which it was published. */
    venue?: string;
    /** The volume of the publication value. */
    volume?: string;
    /** The page number range within the volume. */
    pages?: string;
    /** The title of the cited work. */
    title: string;
    /** The list of authors. For these there will only ever be a name available. */
    authors?: DocAuthor[];
}
/** A figure or table that is referenced in the text. */
export interface DocRef {
    type: "figure" | "table";
    /** The caption on the table of figure. */
    text: string;
    /** The HTML content of the figure or table. Not always available. */
    html?: string;
}
export interface SearchResult {
    doc: Doc;
    text?: string;
}
export interface LlmResult {
    text: string;
}

/**
 * Determine the URL that the API will be available at. This is basically just
 * to allow local development server of Vite to still work by accessing a different
 * port for the API.
 *
 * @returns The URL with which to connect to the API.
 */
function getApiUrl() {
    let url;
    const params = new URLSearchParams(document.location.search);
    if (params.has("api")) {
        url = params.get("api")!;
    } else {
        if (document.location.host == "localhost:5173") {
            url = `http://localhost:8099/api`;
        } else {
            url = `${document.location.protocol}//${document.location.host}/api`;
        }
    }
    return url;
}

/**
 * For every line in a response object invoke the given callback. If there is no
 * body, then this function has no effect.
 *
 * @param response The response to read lines from.
 * @param block The function to call for every new line that arrives.
 */
async function bodyLinesDo(
    response: Response,
    block: (v: string) => Promise<void>,
) {
    if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            for (let i = 0; i < lines.length - 1; i++) {
                await block(lines[i]!);
            }
            buffer = lines[lines.length - 1]!;
        }
        if (buffer.length > 0) {
            await block(buffer);
        }
    }
}

/** Cache the suggestions to avoid unnecessary API calls. */
const allSuggestions = new NruCache<string, boolean>(1024);
const cachedSuggestions = new NruCache<string, boolean>(32);

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
    const [result, setResult] = useStateWithDep<string[]>(
        () => allSuggestions.keys(),
        [query],
    );
    useEffect(() => {
        if (query.length !== 0 && !cachedSuggestions.get(query)) {
            cachedSuggestions.set(query, true);
            fetch(`${getApiUrl()}/suggestions?q=${encodeURIComponent(query)}`)
                .then(async response => {
                    await bodyLinesDo(response, async row => {
                        if (!allSuggestions.get(row)) {
                            allSuggestions.set(row, true);
                            setResult(allSuggestions.keys());
                        }
                    });
                })
                .catch(e => {
                    console.error("API request failed", e);
                });
        }
    }, [query, setResult]);
    return result;
}

/**
 * We cache documents so that the navigation from the search results to the
 * individual articles does not need to make any new request.
 */
const cachedDocuments = new NruCache<number, Doc>(256);

/**
 * React hook for retrieving a document given it's unique identifier.
 *
 * @param id The id of the document to retrieve.
 * @returns `undefined` while loading, `null` if missing, and a `Doc` instance otherwise.
 */
export function useDocument(id: number) {
    const [result, setResult] = useStateWithDep<Doc | undefined | null>(
        () => cachedDocuments.get(id),
        [id],
    );
    useEffect(() => {
        if (!cachedDocuments.get(id)) {
            const controller = new AbortController();
            fetch(`${getApiUrl()}/article/${id}`, { signal: controller.signal })
                .then(async response => {
                    if (response.status === 404) {
                        setResult(null);
                    } else {
                        const document = (await response.json()) as Doc;
                        cachedDocuments.set(id, document);
                        if (!controller.signal.aborted) {
                            setResult(document);
                        }
                    }
                })
                .catch(e => {
                    if (
                        !(e instanceof DOMException) ||
                        e.name !== "AbortError"
                    ) {
                        console.error("API request failed", e);
                    }
                });
            return () => controller.abort();
        }
    }, [id, setResult]);
    return result;
}

/**
 * Similar to the case for documents, we cache the complete search result for a
 * small number of queries such that navigation back from an article does not
 * not have to again make an API request.
 */
const cachedQueries = new NruCache<string, SearchResult[]>(16);

/**
 * This is a react hook that queries the search result for a specific query. The
 * results will be ordered from most relevant to least relevant.
 *
 * @param query The query to use to search the IR system.
 * @param limit The maximum number of articles we are interested in. This hook
 *              may however return more articles if they have already been cached.
 * @param rerank Whether to use neural ranking.
 * @param expand Whether to use query expansion.
 * @returns A list of documents sorted by decreasing relevance to the query.
 *          The result will update as new results are received, but new documents
 *          are only ever append to the result.
 */
export function useQueryResults(
    query: string,
    limit: number = 20,
    rerank: boolean = false,
    expand: boolean = false,
) {
    const cacheKey = `${encodeURIComponent(query)}/${rerank}/${expand}`;
    const [result, setResult] = useStateWithDep<
        [boolean, SearchResult[], number]
    >(() => {
        const cached = cachedQueries.get(cacheKey);
        return cached ? [cached.length >= limit, cached, 0] : [false, [], 0];
    }, [cacheKey, limit]);
    useEffect(() => {
        const cached = cachedQueries.get(cacheKey);
        if (!cached || cached.length < limit) {
            const startTime = Date.now();
            const controller = new AbortController();
            const result: SearchResult[] = [...(cached ?? [])];
            const url = `${getApiUrl()}/search?q=${encodeURIComponent(
                query,
            )}&l=${limit}&s=${result.length}&rr=${rerank}&qe=${expand}`;
            fetch(url, {
                signal: controller.signal,
            })
                .then(async response => {
                    await bodyLinesDo(response, async row => {
                        const res = JSON.parse(row) as SearchResult;
                        cachedDocuments.set(res.doc.id, res.doc);
                        result.push(res);
                        if (!controller.signal.aborted) {
                            if (cached && cached.length > result.length) {
                                setResult([
                                    false,
                                    [...result, ...cached.slice(result.length)],
                                    0,
                                ]);
                            } else {
                                setResult([false, [...result], 0]);
                            }
                        }
                    });
                    cachedQueries.set(cacheKey, result);
                    setResult([true, result, Date.now() - startTime]);
                })
                .catch(e => {
                    if (
                        !(e instanceof DOMException) ||
                        e.name !== "AbortError"
                    ) {
                        console.error("API request failed", e);
                    }
                });
            return () => controller.abort();
        }
    }, [query, limit, rerank, expand, cacheKey, setResult]);
    return result;
}

/**
 * This is a react hook that queries the random articles endpoint. Returned
 * documents are selected completely at random with now meaningful order.
 *
 * @returns A list of documents randomly selected from the collection.
 */
export function useRandom() {
    const [result, setResult] = useState<[boolean, Doc[], number]>([
        false,
        [],
        0,
    ]);
    useEffect(() => {
        const startTime = Date.now();
        const controller = new AbortController();
        const url = `${getApiUrl()}/random`;
        fetch(url, {
            signal: controller.signal,
        })
            .then(async response => {
                const result: Doc[] = [];
                await bodyLinesDo(response, async row => {
                    const document = JSON.parse(row) as Doc;
                    cachedDocuments.set(document.id, document);
                    result.push(document);
                    if (!controller.signal.aborted) {
                        setResult([false, [...result], 0]);
                    }
                });
                setResult([true, result, Date.now() - startTime]);
            })
            .catch(e => {
                if (!(e instanceof DOMException) || e.name !== "AbortError") {
                    console.error("API request failed", e);
                }
            });
        return () => controller.abort();
    }, []);
    return result;
}

/**
 * Similar to the case for query results, we cache the LLM summaries so we don't
 * generate a new one each time. We cache the summaries purely based ony the query
 * and the query expansion and re-ranking settings. This means we will not try
 * to refetch the summary if the documents change, which should not actually happen.
 */
const cachedSummaries = new NruCache<string, string>(32);

/**
 * This is a react hook that queries the summarization endpoint for a specific
 * query and list of documents. Returns both the loading state and a string with
 * the current out put of the LLM.
 *
 * @param query The query to use to search the IR system.
 * @param docs The list of document ids over which we want to compute the summary.
 *             If this parameter is undefined we will only look in the cache.
 * @param rerank Whether we used neural ranking to get the documents.
 * @param expand Whether we used query expansion to get the documents.
 * @returns A list of documents sorted by decreasing relevance to the query.
 *          The result will update as new results are received, but new documents
 *          are only ever append to the result.
 */
export function useLlmSummary(
    query: string,
    docs: number[] | undefined,
    rerank: boolean = false,
    expand: boolean = false,
) {
    const cacheKey = `${encodeURIComponent(query)}/${rerank}/${expand}`;
    const [result, setResult] = useStateWithDep<[boolean, string]>(() => {
        const cached = cachedSummaries.get(cacheKey);
        return cached ? [true, cached] : [false, ""];
    }, [cacheKey]);
    useEffect(() => {
        if (docs && !cachedSummaries.get(cacheKey)) {
            const controller = new AbortController();
            let result = "";
            const url = `${getApiUrl()}/summary?q=${encodeURIComponent(
                query,
            )}&${docs.map(id => `ds=${id}`).join("&")}`;
            fetch(url, {
                signal: controller.signal,
            })
                .then(async response => {
                    await bodyLinesDo(response, async row => {
                        const res = JSON.parse(row) as LlmResult;
                        result += res.text;
                        if (!controller.signal.aborted) {
                            setResult([false, result]);
                        }
                    });
                    cachedSummaries.set(cacheKey, result);
                    setResult([true, result]);
                })
                .catch(e => {
                    if (
                        !(e instanceof DOMException) ||
                        e.name !== "AbortError"
                    ) {
                        console.error("API request failed", e);
                    }
                });
            return () => controller.abort();
        }
    }, [query, docs, cacheKey, setResult]);
    return result;
}
