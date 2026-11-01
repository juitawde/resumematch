
import React from "react";
import ReactDOMServer from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AnalysisPage } from "./src/App.jsx";
import * as api from "./src/api.js";

async function test() {
  const res = await fetch("http://localhost:4000/api/analyses/6ae45efc02510ae6aeea6ac7");
  const json = await res.json();
  const data = json.analysis;

  // Mock getAnalysis
  api.getAnalysis = async () => ({ analysis: data });

  // Test rendering AnalysisPage wrapped in MemoryRouter
  try {
    const html = ReactDOMServer.renderToString(
      React.createElement(MemoryRouter, { initialEntries: ["/analysis/6ae45efc02510ae6aeea6ac7"] },
        React.createElement(Routes, null,
          React.createElement(Route, {
            path: "/analysis/:id",
            element: React.createElement(AnalysisPage, { notify: () => {} })
          })
        )
      )
    );
    console.log("AnalysisPage initial render html length:", html.length);
  } catch (err) {
    console.error("AnalysisPage RENDER CRASHED:", err);
    process.exit(1);
  }
}
test();
