import { Link } from "react-router";
import { useSearchParams } from "react-router";

import { useLlmSummary, useQueryResults } from "../api";

import ContentWrap from "../ui/ContentWrap";
import ArticleCard, { PlaceholderCard } from "../ui/ArticleCard";
import { BotMessageSquare } from "lucide-react";

interface LlmCardProp {
    query: string;
    docs?: number[];
    rerank: boolean;
    expand: boolean;
}

/**
 * A small component for showing the LLM summary at the top of the search
 * results pages. The summary streams in as the tokens come in from the API
 * of the server.
 */
function LlmCard(props: LlmCardProp) {
    const [finished, summary] = useLlmSummary(
        props.query,
        props.docs,
        props.rerank,
        props.expand,
    );
    return (
        <div className="p-5 w-full flex gap-2 flex-row">
            <BotMessageSquare className="w-7 h-7" />
            <div
                className={
                    "flex-1 bg-base-300/40 p-3 rounded-xl " +
                    (finished ? "" : "loading")
                }
            >
                {summary}
            </div>
        </div>
    );
}

/**
 * This is the main page of the system, showing a list of retrieved articles
 * for the search specified in the search params of the URL. By default users
 * are shown only the top 20 results, with the option to expand in case of need.
 */
export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q")!;
    const limit = parseInt(searchParams.get("l") ?? "20");
    const rerank = (searchParams.get("rr") ?? "off") === "on";
    const expand = (searchParams.get("qe") ?? "off") === "on";
    const summary = (searchParams.get("sm") ?? "off") === "on";
    let querySettings = "";
    if (rerank) {
        querySettings += "&rr=on";
    }
    if (expand) {
        querySettings += "&qe=on";
    }
    if (summary) {
        querySettings += "&sm=on";
    }
    const [finished, results, time] = useQueryResults(
        query,
        limit,
        rerank,
        expand,
    );
    return (
        <ContentWrap>
            <div className="grow w-full h-full py-4">
                <div className="mb-6 text-sm select-none">
                    {finished ? (
                        <p className="text-content/65">
                            {results.length}
                            {results.length >= limit ? "+" : ""} result
                            {results.length !== 1 ? "s" : ""} found
                            {time === 0
                                ? " (cached)"
                                : ` in ${Math.round(time / 10) / 100} seconds`}
                        </p>
                    ) : (
                        <p className="text-content/65">Searching...</p>
                    )}
                </div>
                {summary && (
                    <LlmCard
                        query={query}
                        rerank={rerank}
                        expand={expand}
                        docs={
                            results.length >= 5 || finished
                                ? results
                                      .slice(0, Math.min(5, results.length))
                                      .map(r => r.doc.id)
                                : undefined
                        }
                    />
                )}
                <div className="space-y-5">
                    {[...results, ...(finished ? [] : (Array(limit) as null[]))]
                        .slice(0, limit)
                        .map((res, i) => {
                            if (!res) {
                                return <PlaceholderCard key={i} />;
                            } else {
                                return (
                                    <ArticleCard
                                        key={i}
                                        doc={res.doc}
                                        text={res.text}
                                        query={query}
                                    />
                                );
                            }
                        })}
                    {finished && (
                        <div
                            key="want-more"
                            className="text-center pt-12 pb-20"
                        >
                            {results.length >= limit ? (
                                <p className="text-content/65 mb-2">
                                    Need more results?
                                    <Link
                                        to={`/search?q=${encodeURIComponent(
                                            query,
                                        )}&l=${limit + 20}${querySettings}`}
                                        className="pl-4 text-primary underline dark:hover:text-primary/90 hover:text-primary/75"
                                        preventScrollReset
                                        replace
                                    >
                                        Load More
                                    </Link>
                                </p>
                            ) : (
                                <p className="text-content/65 mb-2">
                                    No more results found for your query
                                </p>
                            )}
                        </div>
                    )}
                </div>
                {finished && results.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-content/65 text-lg mb-2">
                            No results found for your query
                        </p>
                        <p className="text-content/50">
                            Try different keywords or check your spelling
                        </p>
                    </div>
                )}
            </div>
        </ContentWrap>
    );
}
