import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const pages = [
  "Jobs",
  "Courses",
  "Candidates",
  "Agents",
  "DecisionReview",
  "ActionCenter",
  "Dashboard",
];

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  for (const page of pages) {
    const { default: Page } = await server.ssrLoadModule(`/src/pages/${page}.jsx`);
    const html = renderToString(
      React.createElement(Page, { onNavigate: () => {} })
    );

    if (!html.trim()) {
      throw new Error(`${page} rendered empty output`);
    }

    console.log(`${page}: rendered`);
  }
} finally {
  await server.close();
}
