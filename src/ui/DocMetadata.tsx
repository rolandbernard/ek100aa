import { BookOpen, Calendar, ExternalLink, Users } from "lucide-react";

import type { Doc } from "../api";
import { boldQuery } from "../util";

/**
 * A small utility function for formatting a data in a more friendly manner. Dates
 * will be formatted with the month written out, followed by the day and the year.
 *
 * @param dateString A ISO formatted data string.
 * @returns A more human friendly representation of the same date.
 */
function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

interface MetaProps {
    doc: Doc;
    query?: string;
}

/**
 * This component is used to show the metadata of an article. If available, it
 * shows among others things the title, the authors, the date of release and the
 * links at which the document is available.
 */
export default function Metadata(props: MetaProps) {
    const { doc, query } = props;
    return (
        <header className="p-8 border-b border-border/50">
            <h1
                className="text-3xl font-bold mb-4 text-content leading-tight"
                style={{ viewTransitionName: "title" }}
            >
                {query ? boldQuery(doc.title, query) : doc.title}
            </h1>
            {doc.meta && (
                <div className="space-y-3 text-sm text-content/70">
                    {doc.meta.authors?.length && (
                        <div className="flex items-start gap-2">
                            <Users className="w-4 h-4 mt-0.5 shrink-0" />
                            <div
                                className="flex flex-wrap gap-x-3 gap-y-2"
                                style={{
                                    viewTransitionName: "authors",
                                }}
                            >
                                {(doc.meta.authors ?? []).map((author, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-1"
                                        title={author.email}
                                    >
                                        <a
                                            href={
                                                author.email &&
                                                `mailto:${author.email}`
                                            }
                                            className="font-medium"
                                        >
                                            {author.name}
                                        </a>
                                        {author.affiliation && (
                                            <span className="text-content/50">
                                                • {author.affiliation}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-4 pt-1">
                        {doc.meta.date && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <div
                                    style={{
                                        viewTransitionName: "date",
                                    }}
                                >
                                    {formatDate(doc.meta.date)}
                                </div>
                            </div>
                        )}
                        {doc.meta.journal && (
                            <div
                                className="flex items-center gap-2"
                                style={{
                                    viewTransitionName: "journal",
                                }}
                            >
                                <BookOpen className="w-4 h-4" />
                                {doc.meta.journal}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2">
                        {doc.meta.doi && (
                            <a
                                href={`https://doi.org/${doc.meta.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary dark:hover:text-primary/90 hover:text-primary/75"
                                style={{
                                    viewTransitionName: "doi",
                                }}
                            >
                                <ExternalLink className="w-4 h-4" />
                                DOI: {doc.meta.doi}
                            </a>
                        )}
                        {doc.meta.license && (
                            <span className="text-content/60">
                                License: {doc.meta.license}
                            </span>
                        )}
                    </div>
                    {doc.meta.urls?.length && (
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {doc.meta.urls.map((url, i) => (
                                <a
                                    key={url}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary dark:hover:text-primary/90 hover:text-primary/75"
                                    style={{
                                        viewTransitionName: "url-" + i,
                                    }}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    {url}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
