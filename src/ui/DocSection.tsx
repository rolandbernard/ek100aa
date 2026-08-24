/* eslint-disable react-hooks/refs */

import type { CSSProperties } from "react";

import type { DocBib, DocPart, DocRef } from "../api";
import { boldQuery, formatAuthors } from "../util";

/**
 * This is a small function for formatting a citation in a way such that it can
 * be put in the title attribute of a dom node to appear as a tooltip.
 *
 * @param bib The bibliography entry of the cited work.
 * @returns A string containing the most important information of the entry.
 */
function formatBibCite(bib: DocBib) {
    let result = bib.title;
    if (bib.authors) {
        result += " • " + formatAuthors(bib.authors);
    }
    if (bib.year) {
        result += " • " + bib.year;
    }
    if (bib.venue) {
        result += " • " + bib.venue;
        if (bib.volume) {
            result += " " + bib.volume;
            if (bib.pages) {
                result += " " + bib.pages;
            }
        }
    }
    return result;
}

interface PartProps {
    part: DocPart;
    query?: string;
    bib?: Record<string, DocBib>;
    ref?: Record<string, DocRef>;
}

/**
 * This component renders one part of a document. Taking care of transforming all
 * the citations and references into clickable elements that scroll to the appropriate
 * entry in the bibliography or list of tables.
 */
function Part(props: PartProps) {
    const {
        part: { text, cite, refs },
        query,
        bib,
        ref,
    } = props;
    const elements = [];
    let lastIndex = 0;
    // We sort the references so that we can go through them in order and cut of
    // one piece of the text at a time.
    const sortedRefs = [...(cite ?? []), ...(refs ?? [])].sort(
        (a, b) => a.start - b.start,
    );
    for (const cite of sortedRefs) {
        if (cite.start > lastIndex) {
            const section = text.substring(lastIndex, cite.start);
            elements.push(
                <span key={`text-${lastIndex}`}>
                    {query ? boldQuery(section, query) : section}
                </span>,
            );
        }
        elements.push(
            <span
                key={`cite-${cite.start}`}
                className="text-primary/80 hover:text-primary/90 cursor-pointer underline decoration-dotted"
                title={
                    bib?.[cite.ref]
                        ? formatBibCite(bib[cite.ref]!)
                        : (ref?.[cite.ref]?.text ?? cite.ref)
                }
                onClick={() => {
                    // Remove the highlighting if already applied. This ensures
                    // that we get the animation even if the same citation is clicked
                    // on multiple times.
                    document
                        .querySelectorAll(".highlighted")
                        .forEach(e => e.classList.remove("highlighted"));
                    // Find the matching entry and scroll to it.
                    const selected = document.querySelector("#" + cite.ref);
                    selected?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                    // Play a small animation to highlight which entry was actually
                    // intended with the scroll.
                    selected?.classList?.add("highlighted");
                }}
            >
                {text.substring(cite.start, cite.end)}
            </span>,
        );
        lastIndex = cite.end;
    }
    if (lastIndex < text.length) {
        const section = text.substring(lastIndex);
        elements.push(
            <span key={`text-${lastIndex}`}>
                {query ? boldQuery(section, query) : section}
            </span>,
        );
    }
    return <div className="text-justify">{elements}</div>;
}

interface SectionProps {
    parts: DocPart[];
    bib?: Record<string, DocBib>;
    ref?: Record<string, DocRef>;
    headers?: number;
    forceHeader?: string;
    query?: string;
    className?: string;
    style?: CSSProperties;
}

/**
 * This component is responsible for rendering a complete section of a document.
 * A section consists of multiple parts, and also includes possible subsection
 * headers that may be present in the different parts.
 */
export default function Section(props: SectionProps) {
    const elements = [];
    if (props.forceHeader) {
        elements.push(
            <div
                key={elements.length}
                className={
                    "mb-4 font-semibold " +
                    (["text-4xl", "text-3xl", "text-2xl", "text-xl", "text-lg"][
                        props.headers ?? 4
                    ] ?? "")
                }
            >
                {props.forceHeader}
            </div>,
        );
    }
    let lastHeaders: string[] = [];
    for (const part of props.parts) {
        if (part.section && props.headers !== undefined) {
            // Emit only those headers that have not been in use already before.
            // The further from the end the header, the smaller we will show it.
            for (let i = 1; i <= part.section.length; i++) {
                if (
                    part.section[part.section.length - i] !==
                    lastHeaders[lastHeaders.length - i]
                ) {
                    elements.push(
                        <div
                            key={elements.length}
                            className={
                                "font-semibold " +
                                ([
                                    "text-4xl mt-6 mb-4",
                                    "text-3xl mt-6 mb-4",
                                    "text-2xl mt-5 mb-3",
                                    "text-xl mt-4 mb-2",
                                    "text-lg mt-3 mb-1",
                                ][i + props.headers] ?? "")
                            }
                        >
                            {part.section[part.section.length - i]}
                        </div>,
                    );
                }
            }
            lastHeaders = part.section;
        }
        elements.push(
            <Part
                key={elements.length}
                part={part}
                query={props.query}
                bib={props.bib}
                ref={props.ref}
            />,
        );
    }
    return (
        <section
            className={"mb-8 " + (props.className ?? "")}
            style={props.style}
        >
            {elements}
        </section>
    );
}
