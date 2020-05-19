import { mapL4toMermaid } from "./mermaid";
import { makeProgram, makeProcExp, makeVarDecl, makeAppExp, makePrimOp, makeVarRef, makeNumExp, isCompoundExp } from "./L4-ast";
import { Graph, isCompoundGraph } from "./mermaid-ast";
import { bind, makeOk, Result } from "../shared/result";

const mermaidAST = mapL4toMermaid(
    makeProgram([
        makeProcExp([
            makeVarDecl('x'), makeVarDecl('y')
        ], [
            makeAppExp(
                makeProcExp([
                    makeVarDecl('x')
                ], [
                    makeAppExp(
                        makePrimOp('+'),
                        [makeVarRef('x'), makeVarRef('y')]
                    )
                ]), [
                    makeAppExp(makePrimOp('+'), [makeVarRef('x'), makeVarRef('y')])
                ]
            ),
            makeNumExp(1)
        ]),
    ])
);

// const mermaidAST = mapL4toMermaid(
//     makeProcExp([
//         makeVarDecl('x'), makeVarDecl('y')
//     ], [
//         makeAppExp(
//             makeProcExp([
//                 makeVarDecl('x')
//             ], [
//                 makeAppExp(
//                     makePrimOp('+'),
//                     [makeVarRef('x'), makeVarRef('y')]
//                 )
//             ]), [
//                 makeAppExp(makePrimOp('+'), [makeVarRef('x'), makeVarRef('y')])
//             ]
//         ),
//         makeNumExp(1)
//     ])
// );
// const mermaidAST = mapL4ArrChildrenToMermaid(program.exps, makeNodeDecl(programId, "Program"), expsId, "exps");
console.log(JSON.stringify(mermaidAST));
// bind<Graph, void>(mermaidAST, (g: Graph): Result<void> => {
//     isCompoundGraph(g.content) ? console.log(g.content.edges.length) : console.log(1);
//     return makeOk<void>(console.log());
// });