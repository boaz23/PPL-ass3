// ===========================================================
// AST type models
import { map, zipWith } from "ramda";
import { first, second, rest, allT, isEmpty } from "../shared/list";
import { isArray, isString, isNumericString, isIdentifier } from "../shared/type-predicates";
import { Result, makeOk, makeFailure, bind, mapResult, safe2 } from "../shared/result";
import { parse as p, isSexpString, isToken } from "../shared/parser";
import { Sexp, Token } from "s-expression";

/*
;; =============================================================================
;;<graph> ::= <header> <graphContent> // Graph(dir: Dir, content: GraphContent)
;;<header> ::= graph (TD|LR)<newline> // Direction can be TD or LR
;;<graphContent> ::= <atomicGraph> | <compoundGraph>
;;<atomicGraph> ::= <nodeDecl>
;;<compoundGraph> ::= <edge>+
;;<edge> ::= <node> --><edgeLabel>? <node><newline> // <edgeLabel> is optional
;;// Edge(from: Node, to: Node, label?: string)
;;<node> ::= <nodeDecl> | <nodeRef>
;;<nodeDecl> ::= <identifier>["<string>"] // NodeDecl(id: string, label: string)
;;<nodeRef> ::= <identifier> // NodeRef(id: string)
;;<edgeLabel> ::= |<identifier>| // string
*/

// START Unuion bound exp
export type GraphContent = AtomicGraph | CompoundGraph ;
export type Direction = TD | LR;
export type Node = NodeDecl | NodeRef;
// END Unuion bound exp

//START AST interface
export interface Graph {tag: "Graph" , dir: Direction , content?: GraphContent};
export interface AtomicGraph {tag: "AtomicGraph" , node: NodeDecl};
export interface TD {tag: "TD"};
export interface LR {tag: "LR"};
export interface NodeDecl {tag: "NodeDecl" , id: string , label: string};
export interface NodeRef {tag:"NodeRef" , id: string};
export interface CompoundGraph {tag: "CompoundGraph" , edges: Edge[]};
export interface Edge {tag: "Edge", from: Node, to: Node, label?: string};
export interface EdgeLabel {tag: "EdgeLabel", var: string};
//END AST interface

//START Constractors ZONE 
export const makeGraph = (dir:Direction,content?: GraphContent): Graph =>
    ({tag: "Graph", dir: dir , content: content});

export const makeAtomicGraph = (node:NodeDecl): AtomicGraph =>
    ({tag: "AtomicGraph", node: node});

export const makeTD = (): TD =>
    ({tag: "TD"});

export const makeLR = (): LR =>
    ({tag: "LR"});

export const makeNodeDecl = (id: string , label: string ) : NodeDecl =>
({tag: "NodeDecl" , id: id , label: label});

export const makeNodeRef = (id: string ) : NodeRef =>
    ({tag: "NodeRef" , id: id});

export const makeCompoundGraph = (edges: Edge[]): CompoundGraph =>
    ({tag: "CompoundGraph", edges: edges});

export const makeEdge = (from: Node, to: Node, label?: string): Edge =>
    ({tag: "Edge", from: from , to: to, label : label});

export const makeEdgeLabel = (Var: string): EdgeLabel =>
    ({tag: "EdgeLabel", var: Var });

//END Constractors ZONE 

//START is ZONE
export const isGraph = (x: any): x is Graph => x.tag === "Graph";
export const isAtomicGraph = (x: any): x is AtomicGraph => x.tag === "AtomicGraph";
export const isTD = (x: any): x is TD => x.tag === "TD";
export const isLR = (x: any): x is LR => x.tag === "LR";
export const isNodeDecl = (x: any): x is NodeDecl => x.tag === "NodeDecl";
export const isNodeRef = (x: any): x is NodeRef => x.tag === "NodeRef";
export const isCompoundGraph = (x: any): x is CompoundGraph => x.tag === "CompoundGraph";
export const isEdge = (x: any): x is Edge => x.tag === "Edge";
export const isEdgeLabel = (x: any): x is EdgeLabel => x.tag === "EdgeLabel";
//END is ZONE


export const isGraphContent = (x: any): x is GraphContent  => isAtomicGraph(x) || isCompoundGraph(x);
export const isDirection = (x: any): x is Direction => isTD(x) || isLR(x);
export const isNode = (x: any): x is Node => isNodeDecl(x) || isNodeRef(x);