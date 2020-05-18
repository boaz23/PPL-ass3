import { Result, makeFailure, mapResult, makeOk, bind } from "../shared/result";
import { Graph, GraphContent, makeGraph, makeTD, makeCompoundGraph, makeEdge, makeNodeDecl, makeAtomicGraph, Edge, makeNodeRef, NodeDecl } from "./mermaid-ast";
import { Program, Parsed, isCExp, isProgram, isExp, Exp } from "./L4-ast";
import { reduce } from "ramda";

export const makeVarGen = (v: string): () => string => {
    let count: number = 0;
    return () => {
        count++;
        return `${v}_${count}`;
    };
};

export const mapL4toMermaid = (exp: Parsed): Result<Graph> => {
    const makeUniqueProgramId = makeVarGen("Program");
    const makeUniqueExpsId = makeVarGen("Exps");
    const makeUniqueDefineExpId = makeVarGen("DefineExp");
    const makeUniqueNumExpId = makeVarGen("NumExp");
    const makeUniqueBoolExpId = makeVarGen("BoolExp");
    const makeUniqueStrExpId = makeVarGen("StrExp");
    const makeUniquePrimOpId = makeVarGen("PrimOp");
    const makeUniqueVarRefId = makeVarGen("VarRef");
    const makeUniqueVarDeclId = makeVarGen("VarDecl");
    const makeUniqueAppExpId = makeVarGen("AppExp");
    const makeUniqueRandsId = makeVarGen("Rands");
    const makeUniqueIfExpId = makeVarGen("IfExp");
    const makeUniqueProcExpId = makeVarGen("ProcExp");
    const makeUniqueParamsId = makeVarGen("Params");
    const makeUniqueBodyId = makeVarGen("Body");
    const makeUniqueBindingId = makeVarGen("Binding");
    const makeUniqueLetExpId = makeVarGen("LetExp");
    const makeUniqueBindingsId = makeVarGen("Bindings");
    const makeUniqueLitExpId = makeVarGen("LitExp");
    const makeUniqueLetrecExpId = makeVarGen("LetrecExp");
    const makeUniqueSetExpId = makeVarGen("SetExp");

    const makeNodeDeclFromExp = (exp: Exp): Result<NodeDecl> =>
        makeFailure<NodeDecl>("");

    const mapL4ExpToMermaid = (exp: Exp, id: string): Result<Edge[]> => {
        return makeFailure("");
    };

    const mapL4ProgramToMermaid = (program: Program): Result<Graph> => {
        const programId = makeUniqueProgramId();
        const expsId = makeUniqueExpsId();
        return bind(
            mapResult(
                (exp: Exp) => {
                    const node = makeNodeDeclFromExp(exp);
                    return bind(node, (n: NodeDecl) => bind(mapL4ExpToMermaid(exp, n.id), (edges: Edge[]) =>
                        makeOk([makeEdge(makeNodeRef(expsId), n)].concat(edges))))
                },
                program.exps
            ),
            (contents: Edge[][]) =>
                makeOk(makeGraph(
                    makeTD(),
                    makeCompoundGraph([makeEdge(
                        makeNodeDecl(programId, "Program"),
                        makeNodeDecl(expsId, ":"),
                        "exps"
                    )].concat(reduce((acc: Edge[], edges: Edge[]) => acc.concat(edges), [], contents)))
                ))
        );
    }

    return isProgram(exp) ? mapL4ProgramToMermaid(exp) :
        isExp(exp) ? makeFailure("") :
        makeFailure("Invalid parameter");
}