import { Result, makeFailure, mapResult, makeOk, bind } from "../shared/result";
import { Graph, GraphContent, makeGraph, makeTD, makeCompoundGraph, makeEdge, makeNodeDecl, makeAtomicGraph, Edge, makeNodeRef, contentIsEmpty, isAtomicGraph, CompoundGraph, NodeDecl, Node } from "./mermaid-ast";
import { Program, Parsed, isProgram, isExp, Exp, isLetrecExp, isSetExp, isDefineExp, isAppExp, isNumExp, isBoolExp, isStrExp, isPrimOp, isVarRef, isIfExp, isProcExp, isBinding, isLetExp, BoolExp, NumExp, StrExp, PrimOp, VarRef, VarDecl, isAtomicExp, DefineExp, AppExp, IfExp, isVarDecl, ProcExp, Binding, LetExp, isLitExp, LetrecExp, SetExp, LitExp } from "./L4-ast";
import { reduce, map } from "ramda";
import { rest, first } from "../shared/list";
import { SExpValue } from "./L4-value";

type L4ASTNode = Exp | VarDecl | Binding | SExpValue;

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

    const topDeclEdgeToRefEdge = (content: CompoundGraph): Edge => {
        const firstEdge = first(content.edges);
        return makeEdge(makeNodeRef(firstEdge.from.id), firstEdge.to, firstEdge.label);
    };
    const mapL4ChildrenExpsToMermaid = (exps: L4ASTNode[], parentNode: Node, edgeLabel?: string): Result<Edge[]> => {
        return bind(
            mapResult(mapL4ExpToMermaid, exps),
            (contents: GraphContent[]): Result<Edge[]> => {
                const expsDecl = map(
                    (content: GraphContent): Edge =>
                        makeEdge(parentNode, isAtomicGraph(content) ? content.node : first(content.edges).from, edgeLabel),
                    contents
                );
                const expsContents = reduce(
                    (acc: Edge[], content: GraphContent): Edge[] =>
                        acc.concat(isAtomicGraph(content) ? [] : [topDeclEdgeToRefEdge(content)].concat(rest(content.edges))),
                    [],
                    contents
                );
                return makeOk(expsDecl.concat(expsContents));
            }
        );
    };
    const mapL4ChildExpToMermaid = (exp: L4ASTNode, parentNode: Node, edgeLabel: string): Result<Edge[]> =>
        mapL4ChildrenExpsToMermaid([exp], parentNode, edgeLabel);
    const mapL4ArrChildrenToMermaid = (exps: L4ASTNode[], parentNode: Node, arrChildId: string, label: string): Result<Edge[]> =>
        bind(
            mapL4ChildrenExpsToMermaid(exps, makeNodeRef(arrChildId)),
            (content: Edge[]): Result<Edge[]> =>
                makeOk([makeEdge(
                    parentNode,
                    makeNodeDecl(arrChildId, ":"),
                    label
                )].concat(content))
        )


    const mapL4VarDeclToMermaid = (varDecl: VarDecl): NodeDecl =>
        makeNodeDecl(makeUniqueVarDeclId(), `VarDecl("${varDecl.var}")`);
    const mapL4AtomicExpToMermaid = (exp: NumExp | BoolExp | StrExp | PrimOp | VarRef): NodeDecl =>
        isNumExp(exp) ? makeNodeDecl(makeUniqueNumExpId(), `NumExp("${exp.val.toString()}")`) :
        isBoolExp(exp) ? makeNodeDecl(makeUniqueBoolExpId(), `BoolExp("${exp.val ? "#t" : "#f"}")`) :
        isStrExp(exp) ? makeNodeDecl(makeUniqueStrExpId(), `StrExp("${exp.val}")`) :
        isPrimOp(exp) ? makeNodeDecl(makeUniquePrimOpId(), `PrimOp("${exp.op}")`) :
        makeNodeDecl(makeUniqueVarRefId(), `VarRef("${exp.var}")`);

    const mapL4DefineExpToMermaid = (exp: DefineExp): Result<GraphContent> => {
        const defineId = makeUniqueDefineExpId();
        return bind(
            mapL4ChildExpToMermaid(exp.val, makeNodeRef(defineId), "val"),
            (edges: Edge[]) =>
                makeOk(makeCompoundGraph(
                    [makeEdge(makeNodeDecl(defineId, "DefineExp"), mapL4VarDeclToMermaid(exp.var), "var")]
                    .concat(edges)
                ))
        );
    }

    const mapL4AppExpToMermaid = (exp: AppExp): Result<GraphContent> => {
        const appExpId = makeUniqueAppExpId();
        const randsId = makeUniqueRandsId();
        return bind(
            mapL4ChildExpToMermaid(exp.rator, makeNodeDecl(appExpId, "AppExp"), "rator"),
            (ratorContent: Edge[]) => bind(
                mapL4ArrChildrenToMermaid(exp.rands, makeNodeRef(appExpId), randsId, "rands"),
                (randsContent: Edge[]) => makeOk(
                    makeCompoundGraph(ratorContent.concat(randsContent))
                )
            )
        );
    }

    const mapL4IfExpToMermaid = (exp: IfExp): Result<GraphContent> => {
        const ifExpId = makeUniqueIfExpId();
        return bind(
            mapL4ChildExpToMermaid(exp.test, makeNodeDecl(ifExpId, "IfExp"), "test"),
            (testContent: Edge[]) => bind(mapL4ChildExpToMermaid(exp.then, makeNodeRef(ifExpId), "then"),
            (thenContent: Edge[]) => bind (mapL4ChildExpToMermaid(exp.alt, makeNodeRef(ifExpId), "alt"),
            (altContent: Edge[]) => makeOk(
                makeCompoundGraph(testContent.concat(thenContent).concat(altContent))
            )))
        )
    }

    const mapL4ProcExpToMermaid = (exp: ProcExp): Result<GraphContent> => {
        const procExpId = makeUniqueProcExpId();
        const paramsId = makeUniqueParamsId();
        const bodyId = makeUniqueBodyId();
        return bind(
            mapL4ArrChildrenToMermaid(exp.args, makeNodeDecl(procExpId, "ProcExp"), paramsId, "args"),
            (paramsContent: Edge[]) => bind(mapL4ArrChildrenToMermaid(exp.body, makeNodeRef(procExpId), bodyId, "body"),
            (bodyContent: Edge[]) => makeOk(
                makeCompoundGraph(paramsContent.concat(bodyContent)))
            )
        )
    }

    const mapL4BindingToMermaid = (exp: Binding): Result<GraphContent> => {
        const bindingId = makeUniqueBindingId();
        return bind(mapL4ChildExpToMermaid(exp.val, makeNodeRef(bindingId), "val"),
        (valContent: Edge[]) => makeOk(makeCompoundGraph(
            [makeEdge(makeNodeDecl(bindingId, "Binding"), mapL4VarDeclToMermaid(exp.var), "var")]
            .concat(valContent)
        )));
    };

    const mapL4LetExoToMermaid = (exp: LetExp | LetrecExp, idGen: () => string): Result<GraphContent> => {
        const letExpId = idGen();
        const bindingsId = makeUniqueBindingsId();
        const bodyId = makeUniqueBodyId();
        return bind(
            mapL4ArrChildrenToMermaid(exp.bindings, makeNodeDecl(letExpId, exp.tag), bindingsId, "bindings"),
            (bindingContent: Edge[]) => bind(mapL4ArrChildrenToMermaid(exp.body, makeNodeRef(letExpId), bodyId, "body"),
            (bodyContent: Edge[]) => makeOk(
                makeCompoundGraph(bindingContent.concat(bodyContent)))
            )
        );
    }

    const mapL4SetExpToMermaid = (exp: SetExp): Result<GraphContent> => {
        const setExpId = makeUniqueSetExpId();
        return bind(
            mapL4ChildExpToMermaid(exp.val, makeNodeRef(setExpId), "val"),
            (edges: Edge[]) =>
                makeOk(makeCompoundGraph(
                    [makeEdge(makeNodeDecl(setExpId, "SetExp"), mapL4AtomicExpToMermaid(exp.var), "var")]
                    .concat(edges)
                ))
        );
    }

    const mapL4ExpToMermaid = (exp: L4ASTNode): Result<GraphContent> =>
        isAtomicExp(exp) ? makeOk(makeAtomicGraph(mapL4AtomicExpToMermaid(exp))) :
        isVarDecl(exp) ? makeOk(makeAtomicGraph(mapL4VarDeclToMermaid(exp))) :
        isDefineExp(exp) ? mapL4DefineExpToMermaid(exp) :
        isAppExp(exp) ? mapL4AppExpToMermaid(exp) :
        isIfExp(exp) ? mapL4IfExpToMermaid(exp) :
        isProcExp(exp) ? mapL4ProcExpToMermaid(exp) :
        isBinding(exp) ? mapL4BindingToMermaid(exp) :
        isLetExp(exp) ? mapL4LetExoToMermaid(exp, makeUniqueLetExpId) :
        isLetrecExp(exp) ? mapL4LetExoToMermaid(exp, makeUniqueLetrecExpId) :
        isSetExp(exp) ? mapL4SetExpToMermaid(exp) :
        isLitExp(exp) ? makeFailure("") :
        makeFailure(`Unknown Expression: ${JSON.stringify(exp)}`);


    const mapL4ProgramToMermaid = (program: Program): Result<Graph> => {
        const programId = makeUniqueProgramId();
        const expsId = makeUniqueExpsId();

        return bind(
            mapL4ArrChildrenToMermaid(program.exps, makeNodeDecl(programId, "Program"), expsId, "exps"),
            (edges: Edge[]): Result<Graph> =>
                makeOk(makeGraph(
                    makeTD(),
                    makeCompoundGraph(edges)
                ))
        );
    }

    return isProgram(exp) ? mapL4ProgramToMermaid(exp) :
        isExp(exp) ? bind(mapL4ExpToMermaid(exp), (content: GraphContent) => makeOk(makeGraph(makeTD(), content))) :
        makeFailure("Invalid argument for map L4 to mermaid");
}

// -----------------------------------------------
// ------------------- UNPARSE -------------------
// -----------------------------------------------
export const unparseMermaid = (exp: Graph): Result<string> =>
    contentIsEmpty(exp.content) ? makeOk(`graph ${exp.dir}\n`) :
    makeOk(`graph ${exp.dir}\n${unparseMermaidContent(exp.content)}`)


const unparseMermaidContent = (cont: GraphContent): Result<string> => makeFailure("");
