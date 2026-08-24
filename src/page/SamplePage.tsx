/* eslint-disable react-hooks/refs */

import { useParams } from "react-router";

import { useSample } from "../api";

import ContentWrap from "../ui/ContentWrap";

/**
 * This is a page for showing the metadata and contents of a single sample.
 */
export default function SamplePage() {
    const params = useParams();
    const sampleId = params["id"]!;
    const sample = useSample(sampleId);
    if (sample === null) {
        // The API finished loading but the article is missing.
        throw new Response("Missing Sample", {
            status: 404,
            statusText: "Not Found",
        });
    }
    if (sample === undefined) {
        // Sample is still loading, show some placeholder in the meantime.
        return (
            <ContentWrap>
                <div className="grow w-full h-full mb-10">
                    <div className="rounded-xl overflow-hidden mt-6 loading p-8">
                        <div className="h-8 bg-base-300 rounded w-full"></div>
                        <div className="h-32 bg-base-300 rounded mt-6 w-4/5"></div>
                        <div className="h-6 bg-base-300 rounded mt-3 w-3/4"></div>
                        <div className="h-6 bg-base-300 rounded mt-3 w-2/3"></div>
                        <div className="h-64 bg-base-300 rounded mt-10 w-full"></div>
                    </div>
                </div>
            </ContentWrap>
        );
    } else {
        console.log(sample);
        return (
            <ContentWrap>
                <div className="grow w-full h-full mb-10">
                    <article
                        className="rounded-xl bg-base-300/40 overflow-hidden mt-6"
                        style={{ viewTransitionName: "article" }}
                    >
                        <div>
                            {sample.id}
                        </div>
                        <div>
                            {sample.start}s - {sample.end}s
                        </div>
                        <div>
                            {sample.label}
                        </div>
                    </article>
                </div>
            </ContentWrap>
        );
    }
}
