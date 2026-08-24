import { Link } from "react-router";

import GlobalSearch from "../ui/GlobalSearch";
import { Dices } from "lucide-react";
import { getRandom } from "../api";

/**
 * This is the index pages (at the root path `/`) of the application. It contains
 * one big search bar in the middle of the screen which which a user can start
 * to perform a search.
 */
export default function HomePage() {
    return (
        <div
            className="grow w-full h-full bg-base-50 flex flex-col items-center justify-center"
            style={{ viewTransitionName: "header-area" }}
        >
            <div className="w-1/2 max-w-3xl min-w-[min(100%,var(--container-lg))] px-4 flex flex-col justify-center items-center">
                <div
                    className="flex flex-col items-center justify-center space-x-3 font-bold whitespace-nowrap mb-16 w-fit select-none"
                    style={{ viewTransitionName: "logo" }}
                >
                    <div className="text-6xl">EPIC-KITCHENS-100</div>
                    <div className="text-4xl">
                        Action Anticipation Visualizer
                    </div>
                </div>
                <GlobalSearch autoFocus={true} />
                <div className="flex flex-col items-center justify-center space-x-3 mt-8">
                    <Link
                        to={`/sample/${getRandom()}`}
                        className="text-sm inline-flex gap-2 items-center text-content/50 hover:text-content/60 align-middle select-none"
                        viewTransition
                        style={{ viewTransitionName: "random" }}
                    >
                        Feeling lucky?
                        <Dices className="w-6 h-6" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
