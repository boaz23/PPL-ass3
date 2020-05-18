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
export interface Graph {tag: "Graph" , dir: Direction , content?: GraphContent}
export interface AtomicGraph {tag: "AtomicGraph" , node: NodeDecl}
export interface TD {tag: "TD" , val: string}
export interface LR {tag: "LR" , val: string}
export interface NodeDecl {tag: "NodeDecl" , id: string , label: string}
export interface NodeRef {tag:"NodeRef" , id: string}
export interface CompoundGraph {tag: "CompoundGraph", node: NodeDecl, edges: Edge[]};
export interface Edge {tag: "Edge", from: Node, to: Node, label?: string}
export interface EdgeLabel {tag: "EdgeLabel", var: string}
//END AST interface

export const makeGraph = (dir:Direction,content?: GraphContent): Graph =>
    ({tag: "Graph", dir: dir , content: content});

export const makeAtomicGraph = (node:NodeDecl): AtomicGraph =>
    ({tag: "AtomicGraph", node: node});

export const makeTD = (val: string): TD =>
    ({tag: "TD", val: val});

export const makeLR = (val: string): LR =>
    ({tag: "LR", val: val});


