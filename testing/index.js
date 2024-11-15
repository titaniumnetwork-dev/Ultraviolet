import { ChemicalServer } from "chemicaljs";
import express from "express";
import {resolve} from "node:path"

const [app, listen] = new ChemicalServer();
const port = process.env.PORT || 3000;

app.use(express.static("public", {
    index: "index.html",
    extensions: ["html"]
}));

app.use("/uv/", express.static(resolve(import.meta.dirname, "../dist")))

app.serveChemical();

app.use((req, res) => {
    res.status(404);
    res.send("404 Error");
});

listen(port, () => {
    console.log(`Basic example listening on port ${port}`);
});