import { Graph } from "./mermaid-ast";
import { bind, Result, makeOk } from "../shared/result";
import { unparseMermaid } from "./mermaid";
import { writeFile } from "fs";

export const writeToFile = (file: string, content: string): Result<boolean> => {
    writeFile(file, content, (err) =>
        err ? console.error("Could not write to File", err.message) : null);
    return makeOk(true);
}

export const writeMermaidASTtoFile = (mermaidAST: Result<Graph>, file: string): Result<boolean> =>
    bind(mermaidAST, (graph: Graph) =>
        bind(unparseMermaid(graph),
            (graphStr: string) => {
                writeToFile(file, graphStr);
                return makeOk(true);
            }));