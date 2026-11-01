
import React from "react";
import ReactDOMServer from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import App from "./src/App.jsx";

async function test() {
  const res = await fetch("http://localhost:4000/api/analyses/6ae457e484b24d2f0265b1f2");
  const json = await res.json();
  console.log("Fetched analysis ID:", json.analysis._id);
}
test();
