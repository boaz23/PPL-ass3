import { Result, makeFailure, mapResult, makeOk, bind } from "../shared/result";
import { Graph, GraphContent, makeGraph, makeTD, makeCompoundGraph, makeEdge, makeNodeDecl, makeAtomicGraph, Edge, makeNodeRef, NodeDecl, isGraph, hasContent, contentIsEmpty } from "./mermaid-ast";
import { Program, Parsed, isCExp, isProgram, isExp, Exp, isLetrecExp, isSetExp } from "./L4-ast";
import { reduce } from "ramda";
import { isDefineExp, makeVarDecl, isAppExp, isNumExp, isBoolExp, isStrExp, isPrimOp, isVarDecl, isVarRef, isIfExp, isProcExp, isBinding, isLetExp } from "../L3/L3-ast";

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
        isDefineExp(exp) ? makeOk(makeNodeDecl(makeUniqueDefineExpId(),"DefineExp")) :
        isNumExp(exp) ? makeOk(makeNodeDecl(makeUniqueNumExpId(),"NumExp")) :
        isBoolExp(exp) ? makeOk(makeNodeDecl(makeUniqueBoolExpId(),"BoolExp")) :
        isStrExp(exp) ? makeOk(makeNodeDecl(makeUniqueStrExpId(),"StrExp")) :
        isPrimOp(exp) ? makeOk(makeNodeDecl(makeUniquePrimOpId(),"PrimOp")) :
        isVarRef(exp) ? makeOk(makeNodeDecl(makeUniqueVarRefId(),"VarRef")) :
        isVarDecl(exp) ? makeOk(makeNodeDecl(makeUniqueVarDeclId(),"VarDecl")) :
        isAppExp(exp) ? makeOk(makeNodeDecl(makeUniqueAppExpId(),"AppExp")) :
        isDefineExp(exp) ?/*TODO:  How to know if its rands */ makeOk(makeNodeDecl(makeUniqueRandsId(),"Rands")) :
        isIfExp(exp) ? makeOk(makeNodeDecl(makeUniqueIfExpId(),"IfExp")) :
        isProcExp(exp) ? makeOk(makeNodeDecl(makeUniqueProcExpId(),"ProcExp")) :
        isDefineExp(exp) ?/*TODO:  How to know if its params */ makeOk(makeNodeDecl(makeUniqueParamsId(),"Params")) :
        isDefineExp(exp) ?/*TODO:  How to know if its params */ makeOk(makeNodeDecl(makeUniqueBodyId(),"Body")) :
        isBinding(exp) ? makeOk(makeNodeDecl(makeUniqueBindingId(),"Binding")) :
        isLetExp(exp) ? makeOk(makeNodeDecl(makeUniqueLetExpId(),"LetExp")) :
        isDefineExp(exp) ?/*TODO:  Wth is the difference between binding and bidgins */makeOk(makeNodeDecl(makeUniqueBindingsId(),"Bindings")) :
        isLetExp(exp) ? makeOk(makeNodeDecl(makeUniqueLitExpId(),"LitExp")) :
        isLetrecExp(exp) ? makeOk(makeNodeDecl(makeUniqueLetrecExpId(),"LetrecExp")) :
        isSetExp(exp) ? makeOk(makeNodeDecl(makeUniqueSetExpId(),"SetExp")) :
        makeFailure<NodeDecl>(`Unknown Expression: ${JSON.stringify(exp)}`);

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













export const unparseMermaid = (exp: Graph): Result<string> =>
    contentIsEmpty(exp.content) ? makeOk(`graph ${exp.dir}\n`) : 
    makeOk(`graph ${exp.dir}\n${unparseMermaidContent(exp.content)}`) 


const unparseMermaidContent = (cont: GraphContent): Result<string> => makeFailure("");

