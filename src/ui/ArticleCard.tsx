import { Link, useNavigate, useViewTransitionState } from "react-router";
import { ExternalLink } from "lucide-react";

import { type Doc } from "../api";
import { boldQuery, formatAuthors } from "../util";

/**
 * Format the given data so that it can be compactly displayed on the article cards.
 *
 * @param dateString The sting containing an ISO formatted date.
 * @returns The year extracted from the date.
 */
function formatDate(dateString: string) {
    return new Date(dateString).getFullYear().toString();
}

/**
 * Extract from the given document the first portion of text. This will in most
 * cases be the beginning of the abstract, but in some cases when the abstract
 * is missing it will return the beginning of the body.
 *
 * @param doc The document to get the text from.
 * @returns The first part of the given document.
 */
function initialText(doc: Doc) {
    let result = "";
    for (const field of [doc.abstract, doc.body, doc.back]) {
        if (field) {
            for (const part of field) {
                result += part.text + "\n";
                if (result.length > 300) {
                    return result.trim();
                }
            }
        }
    }
    return result.trim();
}

/**
 * A simple placeholder that is shown instead of the search results while they
 * are still loading from the server.
 */
export function PlaceholderCard() {
    return (
        <div className="rounded-xl p-5 loading">
            <div className="h-8 bg-base-300 rounded mb-2 w-full"></div>
            <div className="h-4 bg-base-300 rounded mb-3 w-5/6"></div>
            <div className="h-20 bg-base-300 rounded w-full"></div>
            <div className="h-4 bg-base-300 rounded mt-2 w-2/3"></div>
        </div>
    );
}

interface ArticleProps {
    doc: Doc;
    text?: string;
    query?: string;
}

/**
 * This is a component for showing compactly the most important information about
 * a given article. This is used in the list shown in the search page.
 */
export default function ArticleCard(props: ArticleProps) {
    const { doc, text, query } = props;
    const baseUrl = `/article/${doc.id}`;
    const fullUrl = query
        ? `${baseUrl}?q=${encodeURIComponent(query)}`
        : baseUrl;
    const navigate = useNavigate();
    const inTransition = useViewTransitionState(baseUrl);
    return (
        <div
            className="block group bg-base-300/40 rounded-xl p-5 hover:bg-base-300/75 cursor-pointer overflow-hidden"
            onMouseUp={e => {
                if (
                    (!(e.target instanceof Element) ||
                        !e.target.closest("a")) &&
                    !window.getSelection()?.toString()
                ) {
                    navigate(fullUrl, {
                        state: "fromSearch",
                        viewTransition: true,
                    });
                }
            }}
            style={{
                viewTransitionName: inTransition ? "article" : undefined,
            }}
        >
            <Link
                id={"article-" + doc.id}
                to={fullUrl}
                state={"fromSearch"}
                className="block text-xl font-semibold mb-2 group-hover:text-primary"
                viewTransition
                style={{
                    viewTransitionName: inTransition ? "title" : undefined,
                }}
            >
                {query ? boldQuery(doc.title, query) : doc.title}
            </Link>
            {(doc.meta?.authors || doc.meta?.date || doc.meta?.journal) && (
                <div className="text-sm text-content/65 mb-3">
                    {doc.meta?.authors && (
                        <span
                            style={{
                                viewTransitionName: inTransition
                                    ? "authors"
                                    : undefined,
                            }}
                        >
                            {formatAuthors(doc.meta.authors)}
                        </span>
                    )}
                    {doc.meta?.date && (
                        <span
                            style={{
                                viewTransitionName: inTransition
                                    ? "date"
                                    : undefined,
                            }}
                        >
                            {doc.meta?.authors && (
                                <span className="select-none"> • </span>
                            )}
                            {formatDate(doc.meta.date)}
                        </span>
                    )}
                    {doc.meta?.journal && (
                        <span
                            style={{
                                viewTransitionName: inTransition
                                    ? "journal"
                                    : undefined,
                            }}
                        >
                            {(doc.meta?.authors || doc.meta?.date) && (
                                <span className="select-none"> • </span>
                            )}
                            {doc.meta.journal}
                        </span>
                    )}
                </div>
            )}
            {(doc.abstract?.length || doc.body?.length) && (
                <div
                    className="text-content/80 line-clamp-3 text-justify"
                    style={{
                        viewTransitionName: inTransition
                            ? "content"
                            : undefined,
                    }}
                    title={text ?? initialText(doc)}
                >
                    {query
                        ? boldQuery(text ?? initialText(doc), query)
                        : (text ?? initialText(doc))}
                </div>
            )}
            {(doc.meta?.doi || doc.meta?.urls?.length) && (
                <div className="text-xs text-content/50 mt-2">
                    {doc.meta?.doi && (
                        <span>
                            <a
                                href={`https://doi.org/${doc.meta.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center hover:text-content/60 align-middle"
                                style={{
                                    viewTransitionName: inTransition
                                        ? "doi"
                                        : undefined,
                                }}
                            >
                                <ExternalLink className="inline w-3 h-3 mr-1 select-none" />
                                DOI: {doc.meta.doi}
                            </a>
                        </span>
                    )}
                    {doc.meta?.urls?.map((url, i) => (
                        <span key={i}>
                            {(doc.meta?.doi || i !== 0) && (
                                <span className="select-none"> • </span>
                            )}
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center hover:text-content/60 align-middle"
                                style={{
                                    viewTransitionName: inTransition
                                        ? "url-" + i
                                        : undefined,
                                }}
                            >
                                <ExternalLink className="inline w-3 h-3" />
                            </a>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
