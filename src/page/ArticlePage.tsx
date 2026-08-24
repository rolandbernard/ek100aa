/* eslint-disable react-hooks/refs */

import {
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router";
import { ArrowLeft } from "lucide-react";

import { useDocument } from "../api";

import ContentWrap from "../ui/ContentWrap";
import DocSection from "../ui/DocSection";
import DocMetadata from "../ui/DocMetadata";
import DocBibliography from "../ui/DocBibliography";
import DocTableAndFigures from "../ui/DocTablesAndFigures";

/**
 * This is a page for showing the metadata and contents of a single article. The
 * search page shows a list of cards, each of which being a link to a article
 * page. The article page uses the information retrieval systems internal ID for
 * performing the lookup.
 */
export default function ArticlePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const articleId = parseInt(params["id"]!);
    const article = useDocument(articleId);
    if (article === null) {
        // The API finished loading but the article is missing.
        throw new Response("Missing Document", {
            status: 404,
            statusText: "Not Found",
        });
    }
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") ?? undefined;
    // We have a back button only if we came directly from the search. Otherwise,
    // e.g., if the link was opened directly, we would not go back to the search
    // but somewhere else that we can't control.
    const backButton = location.state === "fromSearch" && (
        <div
            className="flex items-center text-primary dark:hover:text-primary/90 hover:text-primary/75 mt-6 cursor-pointer gap-1"
            onClick={() => navigate(-1)}
        >
            <ArrowLeft className="w-4 h-4" />
            Back to search
        </div>
    );
    if (article === undefined) {
        // Article is still loading, show some placeholder in the meantime.
        return (
            <ContentWrap>
                <div className="grow w-full h-full mb-10">
                    {backButton}
                    <div className="rounded-xl overflow-hidden mt-6 loading p-8">
                        <div className="h-8 bg-base-300 rounded w-full"></div>
                        <div className="h-32 bg-base-300 rounded mt-6 w-4/5"></div>
                        <div className="h-6 bg-base-300 rounded mt-3 w-3/4"></div>
                        <div className="h-6 bg-base-300 rounded mt-3 w-2/3"></div>
                        <div className="h-64 bg-base-300 rounded mt-10 w-full"></div>
                        <div className="h-128 bg-base-300 rounded mt-10 w-full"></div>
                    </div>
                </div>
            </ContentWrap>
        );
    } else {
        return (
            <ContentWrap>
                <div className="grow w-full h-full mb-10">
                    {backButton}
                    <article
                        className="rounded-xl bg-base-300/40 overflow-hidden mt-6"
                        style={{ viewTransitionName: "article" }}
                    >
                        <DocMetadata doc={article} query={query} />
                        <div className="p-8 not-md:p-4 not-sm:p-2">
                            {article.abstract?.length && (
                                <DocSection
                                    forceHeader="Abstract"
                                    className="bg-base-300/50 rounded-lg py-4 px-6 border-l-3 border-primary/30"
                                    style={{ viewTransitionName: "content" }}
                                    parts={article.abstract}
                                    query={query}
                                    bib={article.bib}
                                    ref={article.ref}
                                />
                            )}
                            {article.body?.length && (
                                <DocSection
                                    parts={article.body}
                                    style={{
                                        viewTransitionName: article.abstract
                                            ?.length
                                            ? undefined
                                            : "content",
                                    }}
                                    query={query}
                                    bib={article.bib}
                                    ref={article.ref}
                                    headers={0}
                                />
                            )}
                            {article.back?.length && (
                                <DocSection
                                    parts={article.back}
                                    query={query}
                                    bib={article.bib}
                                    ref={article.ref}
                                    headers={1}
                                />
                            )}
                            {article.ref &&
                                Object.keys(article.ref).length > 0 && (
                                    <DocTableAndFigures ref={article.ref} />
                                )}
                            {article.bib &&
                                Object.keys(article.bib).length > 0 && (
                                    <DocBibliography bib={article.bib} />
                                )}
                        </div>
                    </article>
                </div>
            </ContentWrap>
        );
    }
}
