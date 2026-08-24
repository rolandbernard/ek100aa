import { ExternalLink } from "lucide-react";

import type { DocBib } from "../api";
import { sortNamesWithNumbers } from "../util";

interface BibProps {
    bib: Record<string, DocBib>;
}

/**
 * This is a component for displaying the bibliography of a given article. It
 * show each reference one after the other in a list with the most important
 * information such as title, authors, and release year.
 */
export default function Bibliography(props: BibProps) {
    return (
        <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-content">
                Bibliography
            </h2>
            <div className="space-y-3">
                {Object.entries(props.bib)
                    .sort((a, b) => sortNamesWithNumbers(a[0], b[0]))
                    .map(([key, bib]) => (
                        <div
                            key={key}
                            id={key}
                            className="bg-base-50 rounded-lg p-4 text-sm"
                        >
                            <div className="flex items-start gap-2">
                                <div className="flex-1">
                                    <div className="font-medium text-content/90 mb-1">
                                        {bib.title}
                                    </div>
                                    {bib.authors?.length && (
                                        <div className="text-content/70 mb-1">
                                            {bib.authors
                                                .map(a => a.name)
                                                .join("; ")}
                                        </div>
                                    )}
                                    <div className="text-content/60 text-xs">
                                        {bib.venue && <span>{bib.venue}</span>}
                                        {bib.year && <span> ({bib.year})</span>}
                                        {bib.volume && (
                                            <span>, Vol {bib.volume}</span>
                                        )}
                                        {bib.pages && (
                                            <span>, pp {bib.pages}</span>
                                        )}
                                        {bib?.doi && (
                                            <span className="pl-4">
                                                <a
                                                    href={`https://doi.org/${bib.doi}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center hover:text-content/60 align-middle"
                                                >
                                                    <ExternalLink className="inline w-3 h-3 mr-1 select-none" />
                                                    DOI: {bib.doi}
                                                </a>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </section>
    );
}
