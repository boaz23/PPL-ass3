import { expect } from 'chai';
import { mapL4toMermaid } from './part2/mermaid';
import { makeProgram, makeProcExp, makeVarDecl, makeNumExp, makeAppExp, makePrimOp, makeVarRef, makeBoolExp, makeStrExp } from './part2/L4-ast';
import { makeNodeDecl, makeGraph, makeCompoundGraph, makeEdge, makeTD, makeNodeRef, makeAtomicGraph } from './part2/mermaid-ast';
import { makeOk } from './shared/result';

describe('L4 To mermaid', () => {
    it('L4 To Mermaid Test 1', () => {
        const mermadiAST = mapL4toMermaid(
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
        expect(mermadiAST).to.deep.eq(
            makeOk(makeGraph(makeTD(), makeCompoundGraph([
                makeEdge(makeNodeDecl('Program_1', 'Program'), makeNodeDecl('Exps_1', ':'), 'exps'),
                makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('ProcExp_1', 'ProcExp')),
                makeEdge(makeNodeRef('ProcExp_1'), makeNodeDecl('Params_1', ':'), 'args'),
                makeEdge(makeNodeRef('Params_1'), makeNodeDecl('VarDecl_1', 'VarDecl("x")')),
                makeEdge(makeNodeRef('Params_1'), makeNodeDecl('VarDecl_2', 'VarDecl("y")')),
                makeEdge(makeNodeRef('ProcExp_1'), makeNodeDecl('Body_1', ':'), 'body'),
                makeEdge(makeNodeRef('Body_1'), makeNodeDecl('AppExp_1', "AppExp")),
                makeEdge(makeNodeRef('Body_1'), makeNodeDecl('NumExp_1', 'NumExp("1")')),
                makeEdge(makeNodeRef('AppExp_1'), makeNodeDecl('ProcExp_2', 'ProcExp'), 'rator'),
                makeEdge(makeNodeRef('ProcExp_2'), makeNodeDecl('Params_2', ':'), 'args'),
                makeEdge(makeNodeRef('Params_2'), makeNodeDecl('VarDecl_3', 'VarDecl("x")')),
                makeEdge(makeNodeRef('ProcExp_2'), makeNodeDecl('Body_2', ':'), "body"),
                makeEdge(makeNodeRef('Body_2'), makeNodeDecl('AppExp_2', 'AppExp')),
                makeEdge(makeNodeRef('AppExp_2'), makeNodeDecl('PrimOp_1', 'PrimOp("+")'), 'rator'),
                makeEdge(makeNodeRef('AppExp_2'), makeNodeDecl('Rands_2', ':'), 'rands'),
                makeEdge(makeNodeRef('Rands_2'), makeNodeDecl('VarRef_1', 'VarRef("x")')),
                makeEdge(makeNodeRef('Rands_2'), makeNodeDecl('VarRef_2', 'VarRef("y")')),
                makeEdge(makeNodeRef('AppExp_1'), makeNodeDecl('Rands_1', ':'), 'rands'),
                makeEdge(makeNodeRef('Rands_1'), makeNodeDecl('AppExp_3', 'AppExp')),
                makeEdge(makeNodeRef('AppExp_3'), makeNodeDecl('PrimOp_2', 'PrimOp("+")'), 'rator'),
                makeEdge(makeNodeRef('AppExp_3'), makeNodeDecl('Rands_3', ':'), 'rands'),
                makeEdge(makeNodeRef('Rands_3'), makeNodeDecl('VarRef_3', 'VarRef("x")')),
                makeEdge(makeNodeRef('Rands_3'), makeNodeDecl('VarRef_4', 'VarRef("y")')),
            ])))
        );
    });

    it('L4 To Mermaid Test 2', () => {
        const mermadiAST = mapL4toMermaid(makeNumExp(1));
        expect(mermadiAST).to.deep.eq(
            makeOk(makeGraph(makeTD(),
                makeAtomicGraph(makeNodeDecl('NumExp_1', 'NumExp("1")'))
            ))
        )
    });

    it('L4 To Mermaid Test 3', () => {
        const mermadiAST = mapL4toMermaid(
            makeProgram([
                makeNumExp(1),
                makeBoolExp(true),
                makeStrExp('hello')
            ])
        );
        expect(mermadiAST).to.deep.eq(
            makeOk(makeGraph(makeTD(),
                makeCompoundGraph([
                    makeEdge(makeNodeDecl('Program_1', 'Program'), makeNodeDecl('Exps_1', ':'), 'exps'),
                    makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('NumExp_1', 'NumExp("1")')),
                    makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('BoolExp_1', 'BoolExp("#t")')),
                    makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('StrExp_1', 'StrExp("hello")'))
                ])
            ))
        )
    });
});