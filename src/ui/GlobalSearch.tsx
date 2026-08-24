import { useMemo, useState } from "react";
import { Form, Link, useSearchParams } from "react-router";
import { Search, Settings2 } from "lucide-react";

import { useClickOutside, useDebounce } from "../hooks";
import { boldQuery, scoreQuery } from "../util";
import { useSuggestions } from "../api";

interface OptionsProps {
    rerank: boolean;
    expand: boolean;
    summary: boolean;
    setRerank: (v: boolean) => void;
    setExpand: (v: boolean) => void;
    setSummary: (v: boolean) => void;
}

/**
 * This is a small component for showing the dropdown with the search engine
 * settings for users to modify. It shows one toggle button and label for each
 * of the options.
 */
function OptionsSelector(props: OptionsProps) {
    const [show, setShow] = useState(false);
    // The following is to close the drop down menu when the user click elsewhere.
    useClickOutside("div#search-settings", () => setShow(false));
    return (
        <div
            id="search-settings"
            className="relative m-1 z-10"
            style={{ viewTransitionName: "setting" }}
        >
            <button
                type="button"
                aria-controls="search-settings"
                aria-expanded={show}
                id="search-toggle"
                className="
                    flex items-center justify-center w-10 h-10 cursor-pointer
                    rounded-box hover:bg-content/6 dark:hover:bg-content/10 border
                    border-transparent active:border-content/10"
                onClick={() => setShow(true)}
            >
                <Settings2 className="w-6 h-6 block" />
                <span className="sr-only">Settings</span>
            </button>
            <div
                className={
                    "absolute inset-y-full end-3 z-50 " +
                    (show ? "block" : "hidden")
                }
            >
                <div className="flex flex-col w-full bg-base-300 shadow-xl dark:shadow-2xl rounded-box p-1 select-none">
                    {(
                        [
                            [
                                "rr",
                                props.rerank,
                                props.setRerank,
                                "Neural Re-Ranking",
                            ],
                            [
                                "qe",
                                props.expand,
                                props.setExpand,
                                "Query Expansion",
                            ],
                            [
                                "sm",
                                props.summary,
                                props.setSummary,
                                "LLM Summary",
                            ],
                        ] as [string, boolean, (v: boolean) => void, string][]
                    ).map(([key, val, set, name]) => (
                        <label
                            key={key}
                            className="flex items-center gap-1 justify-start whitespace-nowrap p-2 cursor-pointer rounded-box hover:bg-content/6 border border-transparent active:border-content/10 dark:hover:bg-content/10"
                        >
                            <input
                                type="checkbox"
                                id={"setting-" + key}
                                name={key}
                                checked={val}
                                className="sr-only peer"
                                value="on"
                                onChange={e => set(e.target.checked)}
                            />
                            <div className="rounded-full h-3 w-6.5 m-1 relative bg-content/10 peer-checked:bg-primary/50 peer-checked:*:left-3 peer-checked:*:border-primary/50">
                                <div className="absolute -top-0.5 -left-0.5 h-4 w-4 rounded-full bg-base-50 box-content border border-content/20"></div>
                            </div>
                            <div className="text-content peer-checked:text-primary m-1">
                                {name}
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface InnerProps {
    autoFocus?: boolean;
    defaultValue: string;
    defaultRerank: boolean;
    defaultExpand: boolean;
    defaultSummary: boolean;
}

/**
 * This component implements a search bar. The user can enter a query and when
 * submitted it will navigate to the search page using the entered query. The
 * search bar also has a suggestions feature, where while the user is typing,
 * different suggestions are shown below from which the user could choose.
 */
function SearchBar(props: InnerProps) {
    const [[active, hovering], setHovering] = useState<
        [boolean, string | undefined]
    >([false, undefined]);
    const [query, setQuery] = useState(props.defaultValue);
    const [rerank, setRerank] = useState(props.defaultRerank);
    const [expand, setExpand] = useState(props.defaultExpand);
    const [summary, setSummary] = useState(props.defaultSummary);
    const debounced = useDebounce(query.trim().toLowerCase(), 250);
    const suggestions = useSuggestions(debounced);
    const sortedSuggestions = useMemo(() => {
        const scores = Object.fromEntries(
            suggestions.map(t => [t, scoreQuery(t, query)]),
        );
        return suggestions
            .sort((a, b) =>
                scores[a]! > scores[b]! ? -1 : scores[a]! < scores[b]! ? 1 : 0,
            )
            .slice(0, Math.min(10, suggestions.length));
    }, [suggestions, query]);
    let querySettings = "";
    if (rerank) {
        querySettings += "&rr=on";
    }
    if (expand) {
        querySettings += "&qe=on";
    }
    if (summary) {
        querySettings += "&sm=on";
    }
    return (
        <div
            id="global-search"
            className="relative w-full h-full"
            style={{ viewTransitionName: "search-bar" }}
        >
            <Form
                action="/search"
                onSubmit={e => {
                    if (query.trim().length === 0) {
                        e.preventDefault();
                    } else {
                        (
                            document.querySelector(
                                "div#global-search form input",
                            ) as HTMLInputElement
                        ).blur();
                    }
                }}
                viewTransition
                className="flex flex-row items-center"
            >
                <div className="relative w-full">
                    <div
                        className={
                            "peer w-full z-1 relative block text-border " +
                            (query.length === 0 || suggestions.length === 0
                                ? "focus-within:text-primary/75"
                                : "")
                        }
                    >
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none ">
                            <Search className="w-5 h-5 stroke-2" />
                        </div>
                        <input
                            name="q"
                            type="text"
                            className={
                                "block w-full ps-10.5 pe-3 border border-border/80 bg-base-300/50 outline-1! outline-transparent! outline-solid! text-content " +
                                "rounded-2xl py-3 placeholder:text-content/65 placeholder:italic hover:bg-base-300 focus:bg-base-300 " +
                                (query.length === 0 || suggestions.length === 0
                                    ? "focus-visible:border-primary/75 focus-visible:outline-primary/75!"
                                    : "focus-within:rounded-b-none")
                            }
                            placeholder="Search for information on Covid-19..."
                            value={active && hovering ? hovering : query}
                            autoFocus={props.autoFocus}
                            autoComplete="off"
                            onChange={e => {
                                setQuery(e.target.value);
                                setHovering([false, undefined]);
                            }}
                            onKeyDown={e => {
                                if (e.key === "ArrowUp") {
                                    const idx = hovering
                                        ? suggestions.indexOf(hovering)
                                        : -1;
                                    if (idx < 0) {
                                        setHovering([
                                            true,
                                            suggestions[suggestions.length - 1],
                                        ]);
                                    } else if (idx === 0) {
                                        setHovering([false, undefined]);
                                    } else {
                                        setHovering([
                                            true,
                                            suggestions[idx - 1],
                                        ]);
                                    }
                                    e.preventDefault();
                                } else if (e.key === "ArrowDown") {
                                    const idx = hovering
                                        ? suggestions.indexOf(hovering)
                                        : -1;
                                    if (idx < 0) {
                                        setHovering([true, suggestions[0]]);
                                    } else if (idx === suggestions.length - 1) {
                                        setHovering([false, undefined]);
                                    } else {
                                        setHovering([
                                            true,
                                            suggestions[idx + 1],
                                        ]);
                                    }
                                    e.preventDefault();
                                }
                            }}
                        />
                    </div>
                    <div
                        className={
                            "absolute top-0 left-0 right-0 max-h-0 opacity-0 overflow-hidden rounded-2xl shadow-xl dark:shadow-2xl flex flex-col " +
                            (query.trim().length !== 0 &&
                            suggestions.length !== 0
                                ? "focus-within:max-h-128 peer-focus-within:max-h-128 hover:max-h-128 active:max-h-128 " +
                                  "focus-within:opacity-100 peer-focus-within:opacity-100 hover:opacity-100 active:opacity-100"
                                : "")
                        }
                    >
                        <div
                            className="flex-1 flex flex-col w-full bg-base-300 pt-14 pb-2 border border-border/80 rounded-2xl overflow-hidden min-h-0"
                            onMouseLeave={() => setHovering([false, undefined])}
                        >
                            {sortedSuggestions.map(row => (
                                <Link
                                    key={row}
                                    to={`/search?q=${encodeURIComponent(row)}${querySettings}`}
                                    viewTransition
                                    className={
                                        "px-3 py-1.5 cursor-pointer block items-center group text-nowrap overflow-hidden text-ellipsis " +
                                        (row === hovering
                                            ? "bg-content/6 dark:bg-content/10"
                                            : "")
                                    }
                                    onMouseEnter={() =>
                                        setHovering([false, row])
                                    }
                                    onClick={() => setHovering([false, row])}
                                >
                                    <Search
                                        className={
                                            "inline-block w-4 h-4 text-border stroke-2 ml-px mr-3 " +
                                            (row === hovering
                                                ? "text-content/40"
                                                : "")
                                        }
                                    />
                                    {boldQuery(row, query, undefined, true)}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                <OptionsSelector
                    rerank={rerank}
                    expand={expand}
                    summary={summary}
                    setRerank={setRerank}
                    setExpand={setExpand}
                    setSummary={setSummary}
                />
            </Form>
        </div>
    );
}

interface Props {
    autoFocus?: boolean;
}

/**
 * This is a minimal wrapper around the search bar whose only job it is to retrieve
 * teh default query from the search bar and give it to the component.
 */
export default function GlobalSearch(props: Props) {
    const [searchParams] = useSearchParams();
    const defaultQuery = searchParams.get("q") ?? "";
    const defaultRerank = (searchParams.get("rr") ?? "off") === "on";
    const defaultExpand = (searchParams.get("qe") ?? "off") === "on";
    const defaultSummary = (searchParams.get("sm") ?? "off") === "on";
    return (
        <SearchBar
            key={defaultQuery}
            defaultValue={defaultQuery}
            defaultRerank={defaultRerank}
            defaultExpand={defaultExpand}
            defaultSummary={defaultSummary}
            autoFocus={props.autoFocus}
        />
    );
}
