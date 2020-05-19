import { Result, makeFailure, mapResult, makeOk, bind } from "../shared/result";
import { Graph, GraphContent, makeGraph, makeTD, makeCompoundGraph, makeEdge, makeNodeDecl, makeAtomicGraph, Edge, makeNodeRef, isAtomicGraph, CompoundGraph, NodeDecl, Node, isCompoundGraph, isNodeDecl, isNodeRef } from "./mermaid-ast";
import { Program, Parsed, isProgram, isExp, Exp, isLetrecExp, isSetExp, isDefineExp, isAppExp, isNumExp, isBoolExp, isStrExp, isPrimOp, isVarRef, isIfExp, isProcExp, isBinding, isLetExp, BoolExp, NumExp, StrExp, PrimOp, VarRef, VarDecl, isAtomicExp, DefineExp, AppExp, IfExp, isVarDecl, ProcExp, Binding, LetExp, isLitExp, LetrecExp, SetExp, LitExp } from "./L4-ast";
import { reduce, map } from "ramda";
import { rest, first } from "../shared/list";
import { SExpValue, isEmptySExp, isSymbolSExp, isClosure, isCompoundSExp, CompoundSExp, EmptySExp, SymbolSExp } from "./L4-value";
import { isNumber, isString, isBoolean } from "../shared/type-predicates";

// Since we need a counter for each type of node,
// we made a ID generator function for each type.
// However, that caused us to have to define all sub-functions inside
// the scope of the counters, which is inside the mapL4toMermaid function.

// Another thing to notice is some type of L4 AST nodes
// force us to generate the unique ID before we go deeper to its children.
// That's because if a node is compound (has more than one child),
// the edges that connect the node to it's children must have the ID on
// the 'from' Mermaid AST node.
// Therefore, each function that deals with such a L4 AST node
// must have a block body rather than a single expression.
// To keep consistency, we also made every other function that
// deals with L4 AST nodes that way.

type L4ASTNode = Exp | VarDecl | Binding | SExpValue;
type L4AtomicASTNode = NumExp | BoolExp | StrExp | PrimOp | VarRef | VarDecl | EmptySExp | SymbolSExp | number | string | boolean;

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
    const makeUniqueCompoundSExpId = makeVarGen("CompoundSExp");
    const makeUniqueEmptySExpId = makeVarGen("EmptySExp");
    const makeUniqueSymbolSExpId = makeVarGen("SymbolSExp");
    const makeUnique_numberId = makeVarGen("number");
    const makeUnique_booleanId = makeVarGen("boolean");
    const makeUnique_stringId = makeVarGen("string");
    const makeUniqueLetrecExpId = makeVarGen("LetrecExp");
    const makeUniqueSetExpId = makeVarGen("SetExp");

    const boolToString = (b: boolean): string => b ? "#t" : "#f";

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

    const makeL4AtomicLabel = (node: L4AtomicASTNode): string =>
        isNumExp(node) ? `NumExp(${node.val})` :
        isBoolExp(node) ? `BoolExp(${boolToString(node.val)})` :
        isStrExp(node) ? `StrExp(${node.val})` :
        isPrimOp(node) ? `PrimOp(${node.op})` :
        isVarRef(node) ? `VarRef(${node.var})` :
        isVarDecl(node) ? `VarDecl(${node.var})` :
        isEmptySExp(node) ? `EmptySExp` :
        isSymbolSExp(node) ? `SymbolSExp(${node.val})` :
        isNumber(node) ? `number(${node})` :
        isString(node) ? `string(${node})` :
        `boolean(${boolToString(node)})`;

    const mapL4DefineExpToMermaid = (exp: DefineExp): Result<GraphContent> => {
        const defineId = makeUniqueDefineExpId();
        const varId = makeUniqueVarDeclId();
        return bind(
            mapL4ChildExpToMermaid(exp.val, makeNodeRef(defineId), "val"),
            (valContent: Edge[]) => makeOk(
                makeCompoundGraph([
                    makeEdge(
                        makeNodeDecl(defineId, "DefineExp"),
                        makeNodeDecl(varId, makeL4AtomicLabel(exp.var)),
                        "var"
                    )
                ]
                .concat(valContent))
            )
        );
    }

    const mapL4AppExpToMermaid = (exp: AppExp): Result<GraphContent> => {
        const appExpId = makeUniqueAppExpId();
        return bind(
            mapL4ChildExpToMermaid(exp.rator, makeNodeDecl(appExpId, "AppExp"), "rator"),
            (ratorContent: Edge[]) => bind(
                mapL4ArrChildrenToMermaid(
                    exp.rands,
                    makeNodeRef(appExpId),
                    makeUniqueRandsId(),
                    "rands"
                ),
            (randsContent: Edge[]) => makeOk(
                makeCompoundGraph(ratorContent.concat(randsContent))
            ))
        );
    }

    const mapL4IfExpToMermaid = (exp: IfExp): Result<GraphContent> => {
        const ifExpId = makeUniqueIfExpId();
        return bind(
            mapL4ChildExpToMermaid(exp.test, makeNodeDecl(ifExpId, "IfExp"), "test"),
            (testContent: Edge[]) => bind(mapL4ChildExpToMermaid(exp.then, makeNodeRef(ifExpId), "then"),
            (thenContent: Edge[]) => bind(mapL4ChildExpToMermaid(exp.alt, makeNodeRef(ifExpId), "alt"),
            (altContent: Edge[]) => makeOk(
                makeCompoundGraph(testContent.concat(thenContent).concat(altContent))
            )))
        )
    }

    const mapL4ProcExpToMermaid = (exp: ProcExp): Result<GraphContent> => {
        const procExpId = makeUniqueProcExpId();
        return bind(
            mapL4ArrChildrenToMermaid(exp.args, makeNodeDecl(procExpId, "ProcExp"), makeUniqueParamsId(), "args"),
            (paramsContent: Edge[]) => bind(
                mapL4ArrChildrenToMermaid(
                    exp.body,
                    makeNodeRef(procExpId),
                    makeUniqueBodyId(),
                    "body"
                ),
            (bodyContent: Edge[]) => makeOk(
                makeCompoundGraph(paramsContent.concat(bodyContent))
            ))
        )
    }

    const mapL4BindingToMermaid = (exp: Binding): Result<GraphContent> => {
        const bindingId = makeUniqueBindingId();
        const varId = makeUniqueVarDeclId();
        return bind(mapL4ChildExpToMermaid(exp.val, makeNodeRef(bindingId), "val"),
        (valContent: Edge[]) => makeOk(
            makeCompoundGraph([
                makeEdge(
                    makeNodeDecl(bindingId, "Binding"),
                    makeNodeDecl(varId, makeL4AtomicLabel(exp.var)),
                    "var"
                )
            ]
            .concat(valContent))
        ));
    };

    const mapL4LetExoToMermaid = (letExp: LetExp | LetrecExp, idGen: () => string): Result<GraphContent> => {
        const letExpId = idGen();
        return bind(
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
    }

    const mapL4SetExpToMermaid = (setExp: SetExp): Result<GraphContent> => {
        const setExpId = makeUniqueSetExpId();
        const varId = makeUniqueVarRefId();
        return bind(
            mapL4ChildExpToMermaid(setExp.val, makeNodeRef(setExpId), "val"),
            (valContent: Edge[]) => makeOk(
                makeCompoundGraph([
                    makeEdge(
                        makeNodeDecl(setExpId, "SetExp"),
                        makeNodeDecl(varId, makeL4AtomicLabel(setExp.var)),
                        "var")]
                    .concat(valContent)
                ))
        );
    }

    const mapL4ListExpToMermaid = (litExp: LitExp): Result<GraphContent> => {
        const litExpId = makeUniqueLitExpId();
        return bind(
            mapL4ChildExpToMermaid(litExp.val, makeNodeDecl(litExpId, "LitExp"), "val"),
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
        isNumExp(node) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUniqueNumExpId(), makeL4AtomicLabel(node)))) :
        isBoolExp(node) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUniqueBoolExpId(), makeL4AtomicLabel(node)))) :
        isStrExp(node) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUniqueStrExpId(), makeL4AtomicLabel(node)))) :
        isPrimOp(node) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUniquePrimOpId(), makeL4AtomicLabel(node)))) :
        isVarRef(node) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUniqueVarRefId(), makeL4AtomicLabel(node)))) :
        isVarDecl(node) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUniqueVarDeclId(), makeL4AtomicLabel(node)))) :
        isEmptySExp(node) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUniqueEmptySExpId(), makeL4AtomicLabel(node)))) :
        isSymbolSExp(node) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUniqueSymbolSExpId(), makeL4AtomicLabel(node)))) :
        isNumber(node) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUnique_numberId(), makeL4AtomicLabel(node)))) :
        isString(node) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUnique_stringId(), makeL4AtomicLabel(node)))) :
        isBoolean(node) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUnique_booleanId(), makeL4AtomicLabel(node)))) :

        isDefineExp(node) ? mapL4DefineExpToMermaid(node) :
        isAppExp(node) ? mapL4AppExpToMermaid(node) :
        isIfExp(node) ? mapL4IfExpToMermaid(node) :
        isProcExp(node) ? mapL4ProcExpToMermaid(node) :
        isBinding(node) ? mapL4BindingToMermaid(node) :
        isLetExp(node) ? mapL4LetExoToMermaid(node, makeUniqueLetExpId) :
        isLetrecExp(node) ? mapL4LetExoToMermaid(node, makeUniqueLetrecExpId) :
        isSetExp(node) ? mapL4SetExpToMermaid(node) :
        isLitExp(node) ? mapL4ListExpToMermaid(node) :
        isCompoundSExp(node) ? mapL4CompundSExpToMermaid(node) :

        isClosure(node) ? makeFailure("Unexpected node: Closure") :
        makeFailure(`Never: ${JSON.stringify(node)}`);


    const mapL4ProgramToMermaid = (program: Program): Result<Graph> => {
        const programId = makeUniqueProgramId();
        return bind(
            mapL4ArrChildrenToMermaid(program.exps, makeNodeDecl(programId, "Program"), makeUniqueExpsId(), "exps"),
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
    exp.content === undefined ? makeOk(`graph ${exp.dir.tag}\n`) :
    makeOk(`graph ${exp.dir.tag}\n${unparseMermaidContent(exp.content)}`)


const unparseMermaidContent = (cont: GraphContent): string =>
    isAtomicGraph(cont) ? `${unparse(cont.node)}` :
    isCompoundGraph(cont) ? `${map(unparseMermaidEdge, cont.edges).join("")}` :
    "";

const unparseMermaidEdge = (edge: Edge): string =>
     edge.label === undefined ? `${unparse(edge.from)} --> ${unparse(edge.to)}\n` :
    `${unparse(edge.from)} -->|${edge.label}| ${unparse(edge.to)}\n`


export const unparse = (node: Node): string =>
    isNodeDecl(node) ? `${node.id}["${node.label}"]` :
    isNodeRef(node) ? `${node.id}` :
    "";