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
    const article = useSample(sampleId);
    if (article === null) {
        // The API finished loading but the article is missing.
        throw new Response("Missing Document", {
            status: 404,
            statusText: "Not Found",
        });
    }
    return (
        <ContentWrap>
            <div className="grow w-full h-full mb-10">
                <article
                    className="rounded-xl bg-base-300/40 overflow-hidden mt-6"
                    style={{ viewTransitionName: "article" }}
                ></article>
            </div>
        </ContentWrap>
    );
}
