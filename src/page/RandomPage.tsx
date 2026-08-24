import { useRandom } from "../api";

import ContentWrap from "../ui/ContentWrap";
import ArticleCard, { PlaceholderCard } from "../ui/ArticleCard";

/**
 * This is a small page similar to the search page but it only shows random
 * documents from the collection, without any particular ordering or selection
 * criteria.
 */
export default function RandomPage() {
    const [finished, results, time] = useRandom();
    return (
        <ContentWrap>
            <div className="grow w-full h-full py-4 pb-10">
                <div className="mb-6 text-sm select-none">
                    {!finished && (
                        <p className="text-content/65">Sampling...</p>
                    )}
                    {finished && (
                        <p className="text-content/65">
                            {results.length} result
                            {results.length !== 1 ? "s" : ""} selected
                            {time === 0
                                ? " (cached)"
                                : ` in ${Math.round(time / 10) / 100} seconds`}
                        </p>
                    )}
                </div>
                <div className="space-y-5">
                    {[...results, ...(finished ? [] : (Array(20) as null[]))]
                        .slice(0, 20)
                        .map((doc, i) => {
                            if (!doc) {
                                return <PlaceholderCard key={i} />;
                            } else {
                                return <ArticleCard key={i} doc={doc} />;
                            }
                        })}
                </div>
            </div>
        </ContentWrap>
    );
}
