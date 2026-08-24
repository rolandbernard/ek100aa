/* eslint-disable react-hooks/refs */

import type { DocRef } from "../api";
import { sortNamesWithNumbers } from "../util";

interface TablesProps {
    ref: Record<string, DocRef>;
}

/**
 * This is a small component for showing the tables and figures of an article.
 * The components show all of them in a list
 */
export default function TableAndFigures(props: TablesProps) {
    return (
        <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-content">
                Tables & Figures
            </h2>
            <div className="space-y-4">
                {Object.entries(props.ref)
                    .sort((a, b) => sortNamesWithNumbers(a[0], b[0]))
                    .map(([key, ref]) => (
                        <div
                            key={key}
                            id={key}
                            className="bg-base-50 rounded-lg p-4"
                        >
                            <div className="text-content/80 text-sm">
                                {ref.text ??
                                    ref.type[0]?.toUpperCase() +
                                        ref.type.substring(1) +
                                        " " +
                                        key.match(/\d+/)?.[0] +
                                        ": <missing caption>"}
                            </div>
                            {ref.html && (
                                <div
                                    className="mt-4 m-1 text-content/90 text-sm [&_td]:p-1"
                                    dangerouslySetInnerHTML={{
                                        __html: ref.html,
                                    }}
                                />
                            )}
                        </div>
                    ))}
            </div>
        </section>
    );
}
