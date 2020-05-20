import { Result, makeFailure, mapResult, makeOk, bind } from "../shared/result";
import { Graph, GraphContent, makeGraph, makeCompoundGraph, makeEdge, makeNodeDecl, makeAtomicGraph, Edge, makeNodeRef, isAtomicGraph, CompoundGraph, Node, isCompoundGraph, isNodeDecl, isNodeRef } from "./mermaid-ast";
import { Program, Parsed, isProgram, isExp, Exp, isLetrecExp, isSetExp, isDefineExp, isAppExp, isNumExp, isBoolExp, isStrExp, isPrimOp, isVarRef, isIfExp, isProcExp, isBinding, isLetExp, VarRef, VarDecl, DefineExp, AppExp, IfExp, isVarDecl, ProcExp, Binding, LetExp, isLitExp, LetrecExp, SetExp, LitExp, parseL4Exp, parseL4Program } from "./L4-ast";
import { reduce, map } from "ramda";
import { rest, first, isEmpty } from "../shared/list";
import { SExpValue, isEmptySExp, isSymbolSExp, isClosure, isCompoundSExp, CompoundSExp } from "./L4-value";
import { isNumber, isString, isBoolean, isArray } from "../shared/type-predicates";
import { parse, isToken } from "../shared/parser";
import { Sexp } from "s-expression";

// NOTE for the code reviewer:
// Since we need a counter for each type of node,
// we made a ID generator function for each type.
// However, that caused us to have to define all sub-functions inside
// the scope of the counters, which is inside the mapL4toMermaid function.
// We aren't sure we can use global variables, so we sticked to that.

// NOTE for the code reviewer:
// Another thing to notice is some type of L4 AST nodes
// force us to generate the unique ID before we go deeper to its children.
// That's because if a node is compound (has more than one child),
// the edges that connect the node to it's children must have that ID on
// the 'from' Mermaid AST node.
// Therefore, each function that deals with such a L4 AST node
// must have a block body rather than a single expression.
// To keep consistency, we also made every other function that
// deals with compound L4 AST nodes that also generates the unique ID for themselves
// that way (having a block body).

type L4ASTNode = Exp | VarDecl | Binding | SExpValue;

export const makeIdGen = (v: string): () => string => {
    let count: number = 0;
    return () => {
        count++;
        return `${v}_${count}`;
    };
};

export const mapL4toMermaid = (exp: Parsed): Result<Graph> => {
    // NOTE for the code reviewer:
    // We explicitly did not use a map for all of those ID generators.
    // There are a few reasons for that:
    // 1. We aren't sure we're even allowed to use a map because it was only talked about
    //    in the first week of the semester.
    // 2. Initializing such a map would require mutating it until we're done initializing
    //    (which is another mutation on top of the ID generator).
    //    Sure, it's also possible to define all of the keys manually in one statement,
    //    but that would require us to duplicate each AST node name: once in the key and once in the value.
    //    For example: const varGenMap = { ["NumExp"] = makeVarGen("NumExp"), ... };
    // 3. Even if we did make a map, we would want it to be a global variable.
    //    However, as well as with the map, we aren't sure whether we can use global variables.
    const makeUniqueProgramId = makeIdGen("Program");
    const makeUniqueExpsId = makeIdGen("Exps");
    const makeUniqueDefineExpId = makeIdGen("DefineExp");
    const makeUniqueNumExpId = makeIdGen("NumExp");
    const makeUniqueBoolExpId = makeIdGen("BoolExp");
    const makeUniqueStrExpId = makeIdGen("StrExp");
    const makeUniquePrimOpId = makeIdGen("PrimOp");
    const makeUniqueVarRefId = makeIdGen("VarRef");
    const makeUniqueVarDeclId = makeIdGen("VarDecl");
    const makeUniqueAppExpId = makeIdGen("AppExp");
    const makeUniqueRandsId = makeIdGen("Rands");
    const makeUniqueIfExpId = makeIdGen("IfExp");
    const makeUniqueProcExpId = makeIdGen("ProcExp");
    const makeUniqueParamsId = makeIdGen("Params");
    const makeUniqueBodyId = makeIdGen("Body");
    const makeUniqueBindingId = makeIdGen("Binding");
    const makeUniqueLetExpId = makeIdGen("LetExp");
    const makeUniqueBindingsId = makeIdGen("Bindings");
    const makeUniqueLitExpId = makeIdGen("LitExp");
    const makeUniqueCompoundSExpId = makeIdGen("CompoundSExp");
    const makeUniqueEmptySExpId = makeIdGen("EmptySExp");
    const makeUniqueSymbolSExpId = makeIdGen("SymbolSExp");
    const makeUnique_numberId = makeIdGen("number");
    const makeUnique_booleanId = makeIdGen("boolean");
    const makeUnique_stringId = makeIdGen("string");
    const makeUniqueLetrecExpId = makeIdGen("LetrecExp");
    const makeUniqueSetExpId = makeIdGen("SetExp");

    const topDeclEdgeToRefEdge = (content: CompoundGraph): Edge => {
        // Block body to eliminate code duplication (as we use 'first(content.edges)' 3 times)

        const firstEdge = first(content.edges);
        return makeEdge(makeNodeRef(firstEdge.from.id), firstEdge.to, firstEdge.label);
    };
    const mapL4ChildrenToMermaid = (childrenNodes: L4ASTNode[], parentNode: Node, edgeLabel?: string): Result<Edge[]> =>
        bind(
            mapResult(mapL4ExpToMermaid, childrenNodes),
            (contents: GraphContent[]): Result<Edge[]> => makeOk(
                reduce(
                    (acc: Edge[], content: GraphContent): Edge[] =>
                        acc.concat(
                            isAtomicGraph(content) ?
                                makeEdge(parentNode, content.node, edgeLabel) :
                                [makeEdge(parentNode, first(content.edges).from, edgeLabel),
                                topDeclEdgeToRefEdge(content)].concat(rest(content.edges))
                        ),
                    [],
                    contents
                )
            )
        );
    const mapL4ChildExpToMermaid = (childNode: L4ASTNode, parentNode: Node, edgeLabel: string): Result<Edge[]> =>
        mapL4ChildrenToMermaid([childNode], parentNode, edgeLabel);
    const mapL4ArrChildrenToMermaid = (childrenNodes: L4ASTNode[], parentNode: Node, arrChildId: string, label: string): Result<Edge[]> =>
        bind(
            mapL4ChildrenToMermaid(childrenNodes, makeNodeRef(arrChildId)),
            (content: Edge[]): Result<Edge[]> =>
                makeOk([makeEdge(
                    parentNode,
                    makeNodeDecl(arrChildId, ":"),
                    label
                )].concat(content))
        );


    const boolToString = (b: boolean): string => b ? "#t" : "#f";
    const varExpLabel = (node: VarDecl | VarRef): string =>
        `"${node.tag}(${node.var})"`;

    const mapL4AtomicToMermaid = (id: string, label: string): Result<GraphContent> =>
        makeOk(makeAtomicGraph(makeNodeDecl(id, label)))

    const mapL4VarValExpToMermaid = (exp: DefineExp | Binding | SetExp, id: string, varId: string): Result<GraphContent> =>
        bind(
            mapL4ChildExpToMermaid(exp.val, makeNodeRef(id), "val"),
            (valContent: Edge[]) => makeOk(
                makeCompoundGraph([
                    makeEdge(
                        makeNodeDecl(id, exp.tag),
                        makeNodeDecl(varId, varExpLabel(exp.var)),
                        "var"
                    )
                ]
                .concat(valContent))
            )
        );

    const mapL4AppExpToMermaid = (appExp: AppExp): Result<GraphContent> => {
        const appExpId = makeUniqueAppExpId();
        return bind(
            mapL4ChildExpToMermaid(appExp.rator, makeNodeDecl(appExpId, appExp.tag), "rator"),
            (ratorContent: Edge[]) => bind(
                mapL4ArrChildrenToMermaid(
                    appExp.rands,
                    makeNodeRef(appExpId),
                    makeUniqueRandsId(),
                    "rands"
                ),
            (randsContent: Edge[]) => makeOk(
                makeCompoundGraph(ratorContent.concat(randsContent))
            ))
        );
    }

    const mapL4IfExpToMermaid = (ifExp: IfExp): Result<GraphContent> => {
        const ifExpId = makeUniqueIfExpId();
        return bind(
            mapL4ChildExpToMermaid(ifExp.test, makeNodeDecl(ifExpId, ifExp.tag), "test"),
            (testContent: Edge[]) => bind(mapL4ChildExpToMermaid(ifExp.then, makeNodeRef(ifExpId), "then"),
            (thenContent: Edge[]) => bind(mapL4ChildExpToMermaid(ifExp.alt, makeNodeRef(ifExpId), "alt"),
            (altContent: Edge[]) => makeOk(
                makeCompoundGraph(testContent.concat(thenContent).concat(altContent))
            )))
        )
    }

    const mapL4ProcExpToMermaid = (procExp: ProcExp): Result<GraphContent> => {
        const procExpId = makeUniqueProcExpId();
        return bind(
            mapL4ArrChildrenToMermaid(procExp.args, makeNodeDecl(procExpId, procExp.tag), makeUniqueParamsId(), "args"),
            (paramsContent: Edge[]) => bind(
                mapL4ArrChildrenToMermaid(
                    procExp.body,
                    makeNodeRef(procExpId),
                    makeUniqueBodyId(),
                    "body"
                ),
            (bodyContent: Edge[]) => makeOk(
                makeCompoundGraph(paramsContent.concat(bodyContent))
            ))
        )
    }

    const mapL4LetExoToMermaid = (letExp: LetExp | LetrecExp, letExpId: string): Result<GraphContent> =>
        bind(
            mapL4ArrChildrenToMermaid(letExp.bindings, makeNodeDecl(letExpId, letExp.tag), makeUniqueBindingsId(), "bindings"),
            (bindingContent: Edge[]) => bind(
                mapL4ArrChildrenToMermaid(
                    letExp.body,
                    makeNodeRef(letExpId),
                    makeUniqueBodyId(),
                    "body"
                ),
            (bodyContent: Edge[]) => makeOk(
                makeCompoundGraph(bindingContent.concat(bodyContent)))
            )
        );

    const mapL4ListExpToMermaid = (litExp: LitExp): Result<GraphContent> => {
        const litExpId = makeUniqueLitExpId();
        return bind(
            mapL4ChildExpToMermaid(litExp.val, makeNodeDecl(litExpId, litExp.tag), "val"),
            (valContent: Edge[]) => makeOk(
                makeCompoundGraph(valContent)
            )
        );
    }

    const mapL4CompundSExpToMermaid = (compoundSExp: CompoundSExp): Result<GraphContent> => {
        const compoundSExpId = makeUniqueCompoundSExpId();
        return bind(
            mapL4ChildExpToMermaid(compoundSExp.val1, makeNodeDecl(compoundSExpId, "CompoundSExp"), "val1"),
            (val1Content: Edge[]) => bind(mapL4ChildExpToMermaid(compoundSExp.val2, makeNodeRef(compoundSExpId), "val2"),
            (val2Content: Edge[]) => makeOk(
                makeCompoundGraph(val1Content.concat(val2Content))
            ))
        );
    }

    const mapL4ExpToMermaid = (node: L4ASTNode): Result<GraphContent> =>
        isNumExp(node)      ? mapL4AtomicToMermaid(makeUniqueNumExpId(), `"${node.tag}(${node.val})"`) :
        isBoolExp(node)     ? mapL4AtomicToMermaid(makeUniqueBoolExpId(), `"${node.tag}(${boolToString(node.val)})"`) :
        isStrExp(node)      ? mapL4AtomicToMermaid(makeUniqueStrExpId(), `"${node.tag}(${node.val})"`) :
        isPrimOp(node)      ? mapL4AtomicToMermaid(makeUniquePrimOpId(), `"${node.tag}(${node.op})"`) :
        isVarRef(node)      ? mapL4AtomicToMermaid(makeUniqueVarRefId(), varExpLabel(node)) :
        isVarDecl(node)     ? mapL4AtomicToMermaid(makeUniqueVarDeclId(), varExpLabel(node)) :
        isEmptySExp(node)   ? mapL4AtomicToMermaid(makeUniqueEmptySExpId(), `"${node.tag}"`) :
        isSymbolSExp(node)  ? mapL4AtomicToMermaid(makeUniqueSymbolSExpId(), `"${node.tag}(${node.val})"`) :
        isNumber(node)      ? mapL4AtomicToMermaid(makeUnique_numberId(), `"number(${node})"`) :
        isString(node)      ? mapL4AtomicToMermaid(makeUnique_stringId(), `"string(${node})"`) :
        isBoolean(node)     ? mapL4AtomicToMermaid(makeUnique_booleanId(), `"boolean(${boolToString(node)})"`) :

        isDefineExp(node)       ? mapL4VarValExpToMermaid(node, makeUniqueDefineExpId(), makeUniqueVarDeclId()) :
        isAppExp(node)          ? mapL4AppExpToMermaid(node) :
        isIfExp(node)           ? mapL4IfExpToMermaid(node) :
        isProcExp(node)         ? mapL4ProcExpToMermaid(node) :
        isBinding(node)         ? mapL4VarValExpToMermaid(node, makeUniqueBindingId(), makeUniqueVarDeclId()) :
        isLetExp(node)          ? mapL4LetExoToMermaid(node, makeUniqueLetExpId()) :
        isLetrecExp(node)       ? mapL4LetExoToMermaid(node, makeUniqueLetrecExpId()) :
        isSetExp(node)          ? mapL4VarValExpToMermaid(node, makeUniqueSetExpId(), makeUniqueVarRefId()) :
        isLitExp(node)          ? mapL4ListExpToMermaid(node) :
        isCompoundSExp(node)    ? mapL4CompundSExpToMermaid(node) :

        isClosure(node) ? makeFailure("Unexpected node: Closure") :
        makeFailure(`Never: ${JSON.stringify(node)}`);

    const mapL4ProgramToMermaid = (program: Program): Result<GraphContent> => {
        const programId = makeUniqueProgramId();
        return bind(
            mapL4ArrChildrenToMermaid(program.exps, makeNodeDecl(programId, program.tag), makeUniqueExpsId(), "exps"),
            (edges: Edge[]): Result<GraphContent> => makeOk(
                makeCompoundGraph(edges)
            )
        );
    }

    // A var used to eliminate code duplication
    const memrmaidContent: Result<GraphContent> =
        isProgram(exp)  ? mapL4ProgramToMermaid(exp) :
        isExp(exp)      ? mapL4ExpToMermaid(exp) :
        makeFailure("Invalid argument for map L4 to mermaid");
    return bind(memrmaidContent, (content: GraphContent) => makeOk(makeGraph('TD', content)));
}

// -----------------------------------------------
// ------------------- UNPARSE -------------------
// -----------------------------------------------
export const unparseMermaid = (exp: Graph): Result<string> =>
    exp.content === undefined ? makeOk(`graph ${exp.dir}\n`) :
    makeOk(`graph ${exp.dir}\n${unparseMermaidContent(exp.content)}`)


const unparseMermaidContent = (cont: GraphContent): string =>
    isAtomicGraph(cont) ? `${unparseNode(cont.node)}` :
    isCompoundGraph(cont) ? `${map(unparseMermaidEdge, cont.edges).join("")}` :
    "";

const unparseMermaidEdge = (edge: Edge): string =>
     edge.label === undefined ? `${unparseNode(edge.from)} --> ${unparseNode(edge.to)}\n` :
    `${unparseNode(edge.from)} -->|${edge.label}| ${unparseNode(edge.to)}\n`


const unparseNode = (node: Node): string =>
    isNodeDecl(node) ? `${node.id}[${node.label}]` :
    isNodeRef(node) ? `${node.id}` :
    "";

// -----------------------------------------------
// ---------------- L4 To Mermaid ----------------
// -----------------------------------------------
export const L4toMermaid = (concrete: string): Result<string> =>
    bind(
        bind(
            parse(concrete),
            (sexp: Sexp): Result<Graph> =>
                sexp === "" ? makeOk(makeGraph("TD")) :
                isEmpty(sexp) ? makeFailure("Unexpected empty expression or program") :
                parseL4ToMermaid(sexp)
        ),
        (graph: Graph) => unparseMermaid(graph)
    );

const parseL4ToMermaid = (sexp: Sexp): Result<Graph> =>
    bind(parseL4delegate(sexp), (exp: Parsed): Result<Graph> => mapL4toMermaid(exp));

const parseL4delegate = (sexp: Sexp): Result<Parsed> =>
    isToken(sexp) ? parseL4Exp(sexp) :
    isArray(sexp) ? (
        first(sexp) === "L4" ?
        parseL4Program(sexp) :
        parseL4Exp(sexp)
    ) :
    makeFailure("Never");