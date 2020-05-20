// ===========================================================
// AST type models

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
export type Dir = "TD"|"LR";
export type Node = NodeDecl | NodeRef;
// END Unuion bound exp

//START AST interface
export interface Graph {tag: "Graph", dir: Dir, content?: GraphContent};
export interface AtomicGraph {tag: "AtomicGraph", node: NodeDecl};
export interface NodeDecl {tag: "NodeDecl", id: string, label: string};
export interface NodeRef {tag:"NodeRef", id: string};
export interface CompoundGraph {tag: "CompoundGraph", edges: Edge[]};
export interface Edge {tag: "Edge", from: Node, to: Node, label?: string};
//END AST interface

//START Constractors ZONE
export const makeGraph = (dir: Dir, content?: GraphContent): Graph =>
    ({tag: "Graph", dir: dir, content: content});

export const makeAtomicGraph = (node:NodeDecl): AtomicGraph =>
    ({tag: "AtomicGraph", node: node});

export const makeNodeDecl = (id: string, label: string ) : NodeDecl =>
({tag: "NodeDecl", id: id, label: label});

export const makeNodeRef = (id: string ) : NodeRef =>
    ({tag: "NodeRef", id: id});

export const makeCompoundGraph = (edges: Edge[]): CompoundGraph =>
    ({tag: "CompoundGraph", edges: edges});

export const makeEdge = (from: Node, to: Node, label?: string): Edge =>
    ({tag: "Edge", from: from, to: to, label : label});
//END Constractors ZONE

//START is ZONE
export const isGraph = (x: any): x is Graph => x.tag === "Graph";
export const isAtomicGraph = (x: any): x is AtomicGraph => x.tag === "AtomicGraph";
export const isNodeDecl = (x: any): x is NodeDecl => x.tag === "NodeDecl";
export const isNodeRef = (x: any): x is NodeRef => x.tag === "NodeRef";
export const isCompoundGraph = (x: any): x is CompoundGraph => x.tag === "CompoundGraph";
export const isEdge = (x: any): x is Edge => x.tag === "Edge";

export const isGraphContent = (x: any): x is GraphContent  => isAtomicGraph(x) || isCompoundGraph(x);
export const isDir = (x: any): x is Dir => x === "TR" || x === "LR";
export const isNode = (x: any): x is Node => isNodeDecl(x) || isNodeRef(x);
//END is ZONE
