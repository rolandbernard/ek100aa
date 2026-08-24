import { StrictMode } from "react";
import { createBrowserRouter, redirect } from "react-router";
import { RouterProvider } from "react-router/dom";
import { createRoot } from "react-dom/client";

import Root from "./page/Root";
import HomePage from "./page/HomePage";
import ErrorPage from "./page/ErrorPage";
import ArticlePage from "./page/ArticlePage";
import SearchPage from "./page/SearchPage";

import "./styles.css";
import RandomPage from "./page/RandomPage";

const router = createBrowserRouter([
    {
        element: <Root />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, element: <HomePage /> },
            {
                loader: async ({ request }) => {
                    // Make sure that whenever we are at that route, we do actually
                    // also have a non-empty query.
                    const url = new URL(request.url);
                    const q = url.searchParams.get("q");
                    if (!q || q.trim().length === 0) {
                        throw redirect("/");
                    }
                },
                path: "/search",
                element: <SearchPage />,
            },
            {
                loader: async ({ params }) => {
                    // Make sure that the id in the parameter is at least a valid
                    // integer. We don't yet check if the document exists.
                    const q = parseInt(params["id"] ?? "missing id");
                    if (isNaN(q)) {
                        throw new Response("Missing Document", {
                            status: 404,
                            statusText: "Not Found",
                        });
                    }
                },
                path: "/article/:id",
                element: <ArticlePage />,
            },
            {
                path: "/random",
                element: <RandomPage />,
            },
        ],
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
