import { StrictMode } from "react";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { createRoot } from "react-dom/client";

import Root from "./page/Root";
import HomePage from "./page/HomePage";
import ErrorPage from "./page/ErrorPage";
import SamplePage from "./page/SamplePage";

import "./styles.css";

const router = createBrowserRouter([
    {
        element: <Root />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, element: <HomePage /> },
            {
                loader: async ({ params }) => {
                    // Make sure that the id in the parameter is at least a valid
                    // integer. We don't yet check if the document exists.
                    const q = parseInt(params["id"] ?? "missing id");
                    if (isNaN(q)) {
                        throw new Response("Missing Sample", {
                            status: 404,
                            statusText: "Not Found",
                        });
                    }
                },
                path: "/sample/:id",
                element: <SamplePage />,
            },
        ],
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
