import { expect } from 'chai';
import { mapL4toMermaid, L4toMermaid } from './part2/mermaid';
import { makeProgram, makeProcExp, makeVarDecl, makeNumExp, makeAppExp, makePrimOp, makeVarRef, makeBoolExp, makeStrExp, makeDefineExp, makeLitExp, Parsed, unparse, parseL4 } from './part2/L4-ast';
import { makeNodeDecl, makeGraph, makeCompoundGraph, makeEdge, makeNodeRef, makeAtomicGraph, Graph } from './part2/mermaid-ast';
import { makeOk, Result, bind, isFailure } from './shared/result';
import { makeCompoundSExp, makeEmptySExp } from './part2/L4-value';
import { writeToFile } from './part2/mermaid-utils';

const mapL4ASTtoMermaidAST = (file: string, exp: Parsed): Result<Graph> => {
    const mermaidAST = mapL4toMermaid(exp);
    // writeMermaidASTtoFile(mermaidAST, `graphs/${file}`);
    return mermaidAST;
}

describe('L4 AST To Mermaid AST', () => {
    it('L4 To Mermaid Test 1', () => {
        const mermaidAST = mapL4ASTtoMermaidAST("graph1.mmd",
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

        expect(mermaidAST).to.deep.eq(
            makeOk(makeGraph('TD', makeCompoundGraph([
                makeEdge(makeNodeDecl('Program_1', 'Program'), makeNodeDecl('Exps_1', ':'), 'exps'),
                makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('ProcExp_1', 'ProcExp')),
                makeEdge(makeNodeRef('ProcExp_1'), makeNodeDecl('Params_1', ':'), 'args'),
                makeEdge(makeNodeRef('Params_1'), makeNodeDecl('VarDecl_1', '"VarDecl(x)"')),
                makeEdge(makeNodeRef('Params_1'), makeNodeDecl('VarDecl_2', '"VarDecl(y)"')),
                makeEdge(makeNodeRef('ProcExp_1'), makeNodeDecl('Body_1', ':'), 'body'),
                makeEdge(makeNodeRef('Body_1'), makeNodeDecl('AppExp_1', 'AppExp')),
                makeEdge(makeNodeRef('AppExp_1'), makeNodeDecl('ProcExp_2', 'ProcExp'), 'rator'),
                makeEdge(makeNodeRef('ProcExp_2'), makeNodeDecl('Params_2', ':'), 'args'),
                makeEdge(makeNodeRef('Params_2'), makeNodeDecl('VarDecl_3', '"VarDecl(x)"')),
                makeEdge(makeNodeRef('ProcExp_2'), makeNodeDecl('Body_2', ':'), 'body'),
                makeEdge(makeNodeRef('Body_2'), makeNodeDecl('AppExp_2', 'AppExp')),
                makeEdge(makeNodeRef('AppExp_2'), makeNodeDecl('PrimOp_1', '"PrimOp(+)"'), 'rator'),
                makeEdge(makeNodeRef('AppExp_2'), makeNodeDecl('Rands_1', ':'), 'rands'),
                makeEdge(makeNodeRef('Rands_1'), makeNodeDecl('VarRef_1', '"VarRef(x)"')),
                makeEdge(makeNodeRef('Rands_1'), makeNodeDecl('VarRef_2', '"VarRef(y)"')),
                makeEdge(makeNodeRef('AppExp_1'), makeNodeDecl('Rands_2', ':'), 'rands'),
                makeEdge(makeNodeRef('Rands_2'), makeNodeDecl('AppExp_3', 'AppExp')),
                makeEdge(makeNodeRef('AppExp_3'), makeNodeDecl('PrimOp_2', '"PrimOp(+)"'), 'rator'),
                makeEdge(makeNodeRef('AppExp_3'), makeNodeDecl('Rands_3', ':'), 'rands'),
                makeEdge(makeNodeRef('Rands_3'), makeNodeDecl('VarRef_3', '"VarRef(x)"')),
                makeEdge(makeNodeRef('Rands_3'), makeNodeDecl('VarRef_4', '"VarRef(y)"')),
                makeEdge(makeNodeRef('Body_1'), makeNodeDecl('NumExp_1', '"NumExp(1)"')),
            ])))
        );
    });

    it('L4 To Mermaid Test 2', () => {
        const mermaidAST = mapL4ASTtoMermaidAST("graph2.mmd", makeNumExp(1));
        expect(mermaidAST).to.deep.eq(
            makeOk(makeGraph('TD',
                makeAtomicGraph(makeNodeDecl('NumExp_1', '"NumExp(1)"'))
            ))
        )
    });

    it('L4 To Mermaid Test 3', () => {
        const mermaidAST = mapL4ASTtoMermaidAST("graph3.mmd",
            makeProgram([
                makeNumExp(1),
                makeBoolExp(true),
                makeStrExp('hello')
            ])
        );
        expect(mermaidAST).to.deep.eq(
            makeOk(makeGraph('TD',
                makeCompoundGraph([
                    makeEdge(makeNodeDecl('Program_1', 'Program'), makeNodeDecl('Exps_1', ':'), 'exps'),
                    makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('NumExp_1', '"NumExp(1)"')),
                    makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('BoolExp_1', '"BoolExp(#t)"')),
                    makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('StrExp_1', '"StrExp(hello)"'))
                ])
            ))
        )
    });

    it('L4 To Mermaid Test 4 - With Lit Exp', () => {
        const mermaidAST = mapL4ASTtoMermaidAST("graph4.mmd",
            makeDefineExp(
                makeVarDecl('my-list'),
                makeLitExp(makeCompoundSExp(
                    1,
                    makeCompoundSExp(2, makeEmptySExp())
                ))
            )
        );
        expect(mermaidAST).to.deep.eq(
            makeOk(makeGraph('TD',
                makeCompoundGraph([
                    makeEdge(makeNodeDecl('DefineExp_1', 'DefineExp'), makeNodeDecl('VarDecl_1', '"VarDecl(my-list)"'), 'var'),
                    makeEdge(makeNodeRef('DefineExp_1'), makeNodeDecl('LitExp_1', 'LitExp'), 'val'),
                    makeEdge(makeNodeRef('LitExp_1'), makeNodeDecl('CompoundSExp_1', 'CompoundSExp'), 'val'),
                    makeEdge(makeNodeRef('CompoundSExp_1'), makeNodeDecl('number_1', '"number(1)"'), 'val1'),
                    makeEdge(makeNodeRef('CompoundSExp_1'), makeNodeDecl('CompoundSExp_2', 'CompoundSExp'), 'val2'),
                    makeEdge(makeNodeRef('CompoundSExp_2'), makeNodeDecl('number_2', '"number(2)"'), 'val1'),
                    makeEdge(makeNodeRef('CompoundSExp_2'), makeNodeDecl('EmptySExp_1', '"EmptySExp"'), 'val2')
                ])
            ))
        )
    });

    it('L4 To Mermaid Test 5', () => {
        // console.log(JSON.stringify(expectedMermaidAST));
        expect(bind(parseL4(L4_Program1_code),
        (l4ast: Parsed) => {
            const mermaidAST = mapL4ASTtoMermaidAST("graph5.mmd", l4ast);
            // console.log(JSON.stringify(mermaidAST));
            return mermaidAST;
        })).to.deep.eq(MermaidAST_Program1);
    });
});

describe('L4 code to mermaid code', () => {
    it('Translates an empty string to Mermaid code', () => {
        bind(L4toMermaid(''), (str: string) => writeToFile('my-graph.txt', str));
        expect(L4toMermaid('')).to.deep.eq(makeOk(
`graph TD
`
        ));
    });

    it('Translates an empty parentheses to Mermaid code', () => {
        expect(L4toMermaid('()')).to.satisfy(isFailure);
    });

    it('Translates NumExp to Mermaid code', () => {
        expect(L4toMermaid('5')).to.deep.eq(makeOk(
`graph TD
NumExp_1["NumExp(5)"]`
        ));
    });

    it('Translates BoolExp to Mermaid code', () => {
        expect(L4toMermaid('#t')).to.deep.eq(makeOk(
`graph TD
BoolExp_1["BoolExp(#t)"]`
        ));
    });

    it('Translates StrExp to Mermaid code', () => {
        expect(L4toMermaid('"my str"')).to.deep.eq(makeOk(
`graph TD
StrExp_1["StrExp(my str)"]`
        ));
    });

    it('Translates PrimOp to Mermaid code', () => {
        expect(L4toMermaid('+')).to.deep.eq(makeOk(
`graph TD
PrimOp_1["PrimOp(+)"]`
        ));
    });

    it('Translates VarRef to Mermaid code', () => {
        expect(L4toMermaid('my-var')).to.deep.eq(makeOk(
`graph TD
VarRef_1["VarRef(my-var)"]`
        ));
    });

    it('Translates DefineExp to Mermaid code', () => {
        expect(L4toMermaid('(define x 7)')).to.deep.eq(makeOk(
`graph TD
DefineExp_1[DefineExp] -->|var| VarDecl_1["VarDecl(x)"]
DefineExp_1 -->|val| NumExp_1["NumExp(7)"]
`
        ));
    });

    it('Translates AppExp to Mermaid code', () => {
        expect(L4toMermaid('(+ x 7)')).to.deep.eq(makeOk(
`graph TD
AppExp_1[AppExp] -->|rator| PrimOp_1["PrimOp(+)"]
AppExp_1 -->|rands| Rands_1[:]
Rands_1 --> VarRef_1["VarRef(x)"]
Rands_1 --> NumExp_1["NumExp(7)"]
`
        ));
    });

    it('Translates IfExp to Mermaid code', () => {
        expect(L4toMermaid('(if #f x 6)')).to.deep.eq(makeOk(
`graph TD
IfExp_1[IfExp] -->|test| BoolExp_1["BoolExp(#f)"]
IfExp_1 -->|then| VarRef_1["VarRef(x)"]
IfExp_1 -->|alt| NumExp_1["NumExp(6)"]
`
        ));
    });

    it('Translates ProcExp to Mermaid code', () => {
        expect(L4toMermaid('(lambda (a b) b 5)')).to.deep.eq(makeOk(
`graph TD
ProcExp_1[ProcExp] -->|args| Params_1[:]
Params_1 --> VarDecl_1["VarDecl(a)"]
Params_1 --> VarDecl_2["VarDecl(b)"]
ProcExp_1 -->|body| Body_1[:]
Body_1 --> VarRef_1["VarRef(b)"]
Body_1 --> NumExp_1["NumExp(5)"]
`
        ));
    });

    it('Translates LetExp to Mermaid code', () => {
        expect(L4toMermaid('(let ((a x) (b 7)) (+ a b))')).to.deep.eq(makeOk(
`graph TD
LetExp_1[LetExp] -->|bindings| Bindings_1[:]
Bindings_1 --> Binding_1[Binding]
Binding_1 -->|var| VarDecl_1["VarDecl(a)"]
Binding_1 -->|val| VarRef_1["VarRef(x)"]
Bindings_1 --> Binding_2[Binding]
Binding_2 -->|var| VarDecl_2["VarDecl(b)"]
Binding_2 -->|val| NumExp_1["NumExp(7)"]
LetExp_1 -->|body| Body_1[:]
Body_1 --> AppExp_1[AppExp]
AppExp_1 -->|rator| PrimOp_1["PrimOp(+)"]
AppExp_1 -->|rands| Rands_1[:]
Rands_1 --> VarRef_2["VarRef(a)"]
Rands_1 --> VarRef_3["VarRef(b)"]
`
        ));
    });

    it('Translates LetrecExp to Mermaid code', () => {
        expect(L4toMermaid('(letrec ((f (lambda (x) (f x)))) (f 2))')).to.deep.eq(makeOk(
`graph TD
LetrecExp_1[LetrecExp] -->|bindings| Bindings_1[:]
Bindings_1 --> Binding_1[Binding]
Binding_1 -->|var| VarDecl_1["VarDecl(f)"]
Binding_1 -->|val| ProcExp_1[ProcExp]
ProcExp_1 -->|args| Params_1[:]
Params_1 --> VarDecl_2["VarDecl(x)"]
ProcExp_1 -->|body| Body_1[:]
Body_1 --> AppExp_1[AppExp]
AppExp_1 -->|rator| VarRef_1["VarRef(f)"]
AppExp_1 -->|rands| Rands_1[:]
Rands_1 --> VarRef_2["VarRef(x)"]
LetrecExp_1 -->|body| Body_2[:]
Body_2 --> AppExp_2[AppExp]
AppExp_2 -->|rator| VarRef_3["VarRef(f)"]
AppExp_2 -->|rands| Rands_2[:]
Rands_2 --> NumExp_1["NumExp(2)"]
`
        ));
    });

    it('Translates SetExp to Mermaid code', () => {
        expect(L4toMermaid('(set! x 7)')).to.deep.eq(makeOk(
`graph TD
SetExp_1[SetExp] -->|var| VarRef_1["VarRef(x)"]
SetExp_1 -->|val| NumExp_1["NumExp(7)"]
`
        ));
    });

    it('Translates LitExp EmptySExp to Mermaid code', () => {
        expect(L4toMermaid('\'()')).to.deep.eq(makeOk(
`graph TD
LitExp_1[LitExp] -->|val| EmptySExp_1["EmptySExp"]
`
        ));
    });

    it('Translates LitExp SymbolSExp to Mermaid code', () => {
        expect(L4toMermaid('\'hi')).to.deep.eq(makeOk(
`graph TD
LitExp_1[LitExp] -->|val| SymbolSExp_1["SymbolSExp(hi)"]
`
        ));
    });

    it('Translates LitExp CompoundSExp to Mermaid code', () => {
        expect(L4toMermaid('\'(24 #f "hello there")')).to.deep.eq(makeOk(
`graph TD
LitExp_1[LitExp] -->|val| CompoundSExp_1[CompoundSExp]
CompoundSExp_1 -->|val1| number_1["number(24)"]
CompoundSExp_1 -->|val2| CompoundSExp_2[CompoundSExp]
CompoundSExp_2 -->|val1| boolean_1["boolean(#f)"]
CompoundSExp_2 -->|val2| CompoundSExp_3[CompoundSExp]
CompoundSExp_3 -->|val1| string_1["string(hello there)"]
CompoundSExp_3 -->|val2| EmptySExp_1["EmptySExp"]
`
        ));
    });

    it(`Translate L4 code to Mermaid code 2`, () => {
        expect(L4toMermaid(`
            (lambda (x y)
              ((lambda (x) (+ x y))
                (+ x x))
              1)
        `)).to.deep.eq(makeOk(
`graph TD
ProcExp_1[ProcExp] -->|args| Params_1[:]
Params_1 --> VarDecl_1["VarDecl(x)"]
Params_1 --> VarDecl_2["VarDecl(y)"]
ProcExp_1 -->|body| Body_1[:]
Body_1 --> AppExp_1[AppExp]
AppExp_1 -->|rator| ProcExp_2[ProcExp]
ProcExp_2 -->|args| Params_2[:]
Params_2 --> VarDecl_3["VarDecl(x)"]
ProcExp_2 -->|body| Body_2[:]
Body_2 --> AppExp_2[AppExp]
AppExp_2 -->|rator| PrimOp_1["PrimOp(+)"]
AppExp_2 -->|rands| Rands_1[:]
Rands_1 --> VarRef_1["VarRef(x)"]
Rands_1 --> VarRef_2["VarRef(y)"]
AppExp_1 -->|rands| Rands_2[:]
Rands_2 --> AppExp_3[AppExp]
AppExp_3 -->|rator| PrimOp_2["PrimOp(+)"]
AppExp_3 -->|rands| Rands_3[:]
Rands_3 --> VarRef_3["VarRef(x)"]
Rands_3 --> VarRef_4["VarRef(x)"]
Body_1 --> NumExp_1["NumExp(1)"]
`
        ));
    });

    it(`Translates program 1`, () => {
        expect(L4toMermaid(L4_Program1_code)).to.deep.eq(makeOk(Mermaid_Program1_code));
    });
});

const L4_Program1_code =
`(L4
    (define count-odds
      (lambda (tree)
        (+ x 2)
        (let ((counter (make-counter))
              (my-str "my-str-hello")
              (em '())
              (sym 'ok-sym))
            (loop tree)
            (counter-get counter))))
    (let ((p1 (make-pair 1 2))
          (p2 (make-pair 3 4)))
      (cmp-sexp '(1 3 #t "hi-there"))
      (+ (p1 'car) (p2 'cdr)))

    (define f
      (lambda (x)
        (- (if (< x 5) 8 (+ x 9)) 0)
        (letrec ((even? (lambda (x)
                          (if (= x 0)
                              #t
                              (odd? (- x 1)))))
                 (odd? (lambda (x)
                         (if (= x 0)
                             #f
                             (even? (- x 1))))))
          (even? x)
          (odd? (+ x 2))
          (even? 1))))
    (set! count-odds (f 8))
    (f 10))`;

const MermaidAST_Program1 = makeOk(makeGraph('TD', makeCompoundGraph([
        makeEdge(makeNodeDecl('Program_1', 'Program'), makeNodeDecl('Exps_1', ':'), 'exps'),
        makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('DefineExp_1', 'DefineExp')),
        makeEdge(makeNodeRef('DefineExp_1'), makeNodeDecl('VarDecl_1', '"VarDecl(count-odds)"'), 'var'),
        makeEdge(makeNodeRef('DefineExp_1'), makeNodeDecl('ProcExp_1', 'ProcExp'), 'val'),
        makeEdge(makeNodeRef('ProcExp_1'), makeNodeDecl('Params_1', ':'), 'args'),
        makeEdge(makeNodeRef('Params_1'), makeNodeDecl('VarDecl_2', '"VarDecl(tree)"')),
        makeEdge(makeNodeRef('ProcExp_1'), makeNodeDecl('Body_1', ':'), 'body'),
        makeEdge(makeNodeRef('Body_1'), makeNodeDecl('AppExp_1', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_1'), makeNodeDecl('PrimOp_1', '"PrimOp(+)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_1'), makeNodeDecl('Rands_1', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_1'), makeNodeDecl('VarRef_1', '"VarRef(x)"')),
        makeEdge(makeNodeRef('Rands_1'), makeNodeDecl('NumExp_1', '"NumExp(2)"')),
        makeEdge(makeNodeRef('Body_1'), makeNodeDecl('LetExp_1', 'LetExp')),
        makeEdge(makeNodeRef('LetExp_1'), makeNodeDecl('Bindings_1', ':'), 'bindings'),
        makeEdge(makeNodeRef('Bindings_1'), makeNodeDecl('Binding_1', 'Binding')),
        makeEdge(makeNodeRef('Binding_1'), makeNodeDecl('VarDecl_3', '"VarDecl(counter)"'), 'var'),
        makeEdge(makeNodeRef('Binding_1'), makeNodeDecl('AppExp_2', 'AppExp'), 'val'),
        makeEdge(makeNodeRef('AppExp_2'), makeNodeDecl('VarRef_2', '"VarRef(make-counter)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_2'), makeNodeDecl('Rands_2', ':'), 'rands'),
        makeEdge(makeNodeRef('Bindings_1'), makeNodeDecl('Binding_2', 'Binding')),
        makeEdge(makeNodeRef('Binding_2'), makeNodeDecl('VarDecl_4', '"VarDecl(my-str)"'), 'var'),
        makeEdge(makeNodeRef('Binding_2'), makeNodeDecl('StrExp_1', '"StrExp(my-str-hello)"'), 'val'),
        makeEdge(makeNodeRef('Bindings_1'), makeNodeDecl('Binding_3', 'Binding')),
        makeEdge(makeNodeRef('Binding_3'), makeNodeDecl('VarDecl_5', '"VarDecl(em)"'), 'var'),
        makeEdge(makeNodeRef('Binding_3'), makeNodeDecl('LitExp_1', 'LitExp'), 'val'),
        makeEdge(makeNodeRef('LitExp_1'), makeNodeDecl('EmptySExp_1', '"EmptySExp"'), 'val'),
        makeEdge(makeNodeRef('Bindings_1'), makeNodeDecl('Binding_4', 'Binding')),
        makeEdge(makeNodeRef('Binding_4'), makeNodeDecl('VarDecl_6', '"VarDecl(sym)"'), 'var'),
        makeEdge(makeNodeRef('Binding_4'), makeNodeDecl('LitExp_2', 'LitExp'), 'val'),
        makeEdge(makeNodeRef('LitExp_2'), makeNodeDecl('SymbolSExp_1', '"SymbolSExp(ok-sym)"'), 'val'),
        makeEdge(makeNodeRef('LetExp_1'), makeNodeDecl('Body_2', ':'), 'body'),
        makeEdge(makeNodeRef('Body_2'), makeNodeDecl('AppExp_3', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_3'), makeNodeDecl('VarRef_3', '"VarRef(loop)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_3'), makeNodeDecl('Rands_3', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_3'), makeNodeDecl('VarRef_4', '"VarRef(tree)"')),
        makeEdge(makeNodeRef('Body_2'), makeNodeDecl('AppExp_4', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_4'), makeNodeDecl('VarRef_5', '"VarRef(counter-get)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_4'), makeNodeDecl('Rands_4', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_4'), makeNodeDecl('VarRef_6', '"VarRef(counter)"')),
        makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('LetExp_2', 'LetExp')),
        makeEdge(makeNodeRef('LetExp_2'), makeNodeDecl('Bindings_2', ':'), 'bindings'),
        makeEdge(makeNodeRef('Bindings_2'), makeNodeDecl('Binding_5', 'Binding')),
        makeEdge(makeNodeRef('Binding_5'), makeNodeDecl('VarDecl_7', '"VarDecl(p1)"'), 'var'),
        makeEdge(makeNodeRef('Binding_5'), makeNodeDecl('AppExp_5', 'AppExp'), 'val'),
        makeEdge(makeNodeRef('AppExp_5'), makeNodeDecl('VarRef_7', '"VarRef(make-pair)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_5'), makeNodeDecl('Rands_5', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_5'), makeNodeDecl('NumExp_2', '"NumExp(1)"')),
        makeEdge(makeNodeRef('Rands_5'), makeNodeDecl('NumExp_3', '"NumExp(2)"')),
        makeEdge(makeNodeRef('Bindings_2'), makeNodeDecl('Binding_6', 'Binding')),
        makeEdge(makeNodeRef('Binding_6'), makeNodeDecl('VarDecl_8', '"VarDecl(p2)"'), 'var'),
        makeEdge(makeNodeRef('Binding_6'), makeNodeDecl('AppExp_6', 'AppExp'), 'val'),
        makeEdge(makeNodeRef('AppExp_6'), makeNodeDecl('VarRef_8', '"VarRef(make-pair)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_6'), makeNodeDecl('Rands_6', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_6'), makeNodeDecl('NumExp_4', '"NumExp(3)"')),
        makeEdge(makeNodeRef('Rands_6'), makeNodeDecl('NumExp_5', '"NumExp(4)"')),
        makeEdge(makeNodeRef('LetExp_2'), makeNodeDecl('Body_3', ':'), 'body'),
        makeEdge(makeNodeRef('Body_3'), makeNodeDecl('AppExp_7', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_7'), makeNodeDecl('VarRef_9', '"VarRef(cmp-sexp)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_7'), makeNodeDecl('Rands_7', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_7'), makeNodeDecl('LitExp_3', 'LitExp')),
        makeEdge(makeNodeRef('LitExp_3'), makeNodeDecl('CompoundSExp_1', 'CompoundSExp'), 'val'),
        makeEdge(makeNodeRef('CompoundSExp_1'), makeNodeDecl('number_1', '"number(1)"'), 'val1'),
        makeEdge(makeNodeRef('CompoundSExp_1'), makeNodeDecl('CompoundSExp_2', 'CompoundSExp'), 'val2'),
        makeEdge(makeNodeRef('CompoundSExp_2'), makeNodeDecl('number_2', '"number(3)"'), 'val1'),
        makeEdge(makeNodeRef('CompoundSExp_2'), makeNodeDecl('CompoundSExp_3', 'CompoundSExp'), 'val2'),
        makeEdge(makeNodeRef('CompoundSExp_3'), makeNodeDecl('boolean_1', '"boolean(#t)"'), 'val1'),
        makeEdge(makeNodeRef('CompoundSExp_3'), makeNodeDecl('CompoundSExp_4', 'CompoundSExp'), 'val2'),
        makeEdge(makeNodeRef('CompoundSExp_4'), makeNodeDecl('string_1', '"string(hi-there)"'), 'val1'),
        makeEdge(makeNodeRef('CompoundSExp_4'), makeNodeDecl('EmptySExp_2', '"EmptySExp"'), 'val2'),
        makeEdge(makeNodeRef('Body_3'), makeNodeDecl('AppExp_8', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_8'), makeNodeDecl('PrimOp_2', '"PrimOp(+)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_8'), makeNodeDecl('Rands_8', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_8'), makeNodeDecl('AppExp_9', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_9'), makeNodeDecl('VarRef_10', '"VarRef(p1)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_9'), makeNodeDecl('Rands_9', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_9'), makeNodeDecl('LitExp_4', 'LitExp')),
        makeEdge(makeNodeRef('LitExp_4'), makeNodeDecl('SymbolSExp_2', '"SymbolSExp(car)"'), 'val'),
        makeEdge(makeNodeRef('Rands_8'), makeNodeDecl('AppExp_10', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_10'), makeNodeDecl('VarRef_11', '"VarRef(p2)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_10'), makeNodeDecl('Rands_10', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_10'), makeNodeDecl('LitExp_5', 'LitExp')),
        makeEdge(makeNodeRef('LitExp_5'), makeNodeDecl('SymbolSExp_3', '"SymbolSExp(cdr)"'), 'val'),
        makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('DefineExp_2', 'DefineExp')),
        makeEdge(makeNodeRef('DefineExp_2'), makeNodeDecl('VarDecl_9', '"VarDecl(f)"'), 'var'),
        makeEdge(makeNodeRef('DefineExp_2'), makeNodeDecl('ProcExp_2', 'ProcExp'), 'val'),
        makeEdge(makeNodeRef('ProcExp_2'), makeNodeDecl('Params_2', ':'), 'args'),
        makeEdge(makeNodeRef('Params_2'), makeNodeDecl('VarDecl_10', '"VarDecl(x)"')),
        makeEdge(makeNodeRef('ProcExp_2'), makeNodeDecl('Body_4', ':'), 'body'),
        makeEdge(makeNodeRef('Body_4'), makeNodeDecl('AppExp_11', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_11'), makeNodeDecl('PrimOp_3', '"PrimOp(-)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_11'), makeNodeDecl('Rands_11', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_11'), makeNodeDecl('IfExp_1', 'IfExp')),
        makeEdge(makeNodeRef('IfExp_1'), makeNodeDecl('AppExp_12', 'AppExp'), 'test'),
        makeEdge(makeNodeRef('AppExp_12'), makeNodeDecl('PrimOp_4', '"PrimOp(<)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_12'), makeNodeDecl('Rands_12', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_12'), makeNodeDecl('VarRef_12', '"VarRef(x)"')),
        makeEdge(makeNodeRef('Rands_12'), makeNodeDecl('NumExp_6', '"NumExp(5)"')),
        makeEdge(makeNodeRef('IfExp_1'), makeNodeDecl('NumExp_7', '"NumExp(8)"'), 'then'),
        makeEdge(makeNodeRef('IfExp_1'), makeNodeDecl('AppExp_13', 'AppExp'), 'alt'),
        makeEdge(makeNodeRef('AppExp_13'), makeNodeDecl('PrimOp_5', '"PrimOp(+)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_13'), makeNodeDecl('Rands_13', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_13'), makeNodeDecl('VarRef_13', '"VarRef(x)"')),
        makeEdge(makeNodeRef('Rands_13'), makeNodeDecl('NumExp_8', '"NumExp(9)"')),
        makeEdge(makeNodeRef('Rands_11'), makeNodeDecl('NumExp_9', '"NumExp(0)"')),
        makeEdge(makeNodeRef('Body_4'), makeNodeDecl('LetrecExp_1', 'LetrecExp')),
        makeEdge(makeNodeRef('LetrecExp_1'), makeNodeDecl('Bindings_3', ':'), 'bindings'),
        makeEdge(makeNodeRef('Bindings_3'), makeNodeDecl('Binding_7', 'Binding')),
        makeEdge(makeNodeRef('Binding_7'), makeNodeDecl('VarDecl_11', '"VarDecl(even?)"'), 'var'),
        makeEdge(makeNodeRef('Binding_7'), makeNodeDecl('ProcExp_3', 'ProcExp'), 'val'),
        makeEdge(makeNodeRef('ProcExp_3'), makeNodeDecl('Params_3', ':'), 'args'),
        makeEdge(makeNodeRef('Params_3'), makeNodeDecl('VarDecl_12', '"VarDecl(x)"')),
        makeEdge(makeNodeRef('ProcExp_3'), makeNodeDecl('Body_5', ':'), 'body'),
        makeEdge(makeNodeRef('Body_5'), makeNodeDecl('IfExp_2', 'IfExp')),
        makeEdge(makeNodeRef('IfExp_2'), makeNodeDecl('AppExp_14', 'AppExp'), 'test'),
        makeEdge(makeNodeRef('AppExp_14'), makeNodeDecl('PrimOp_6', '"PrimOp(=)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_14'), makeNodeDecl('Rands_14', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_14'), makeNodeDecl('VarRef_14', '"VarRef(x)"')),
        makeEdge(makeNodeRef('Rands_14'), makeNodeDecl('NumExp_10', '"NumExp(0)"')),
        makeEdge(makeNodeRef('IfExp_2'), makeNodeDecl('BoolExp_1', '"BoolExp(#t)"'), 'then'),
        makeEdge(makeNodeRef('IfExp_2'), makeNodeDecl('AppExp_15', 'AppExp'), 'alt'),
        makeEdge(makeNodeRef('AppExp_15'), makeNodeDecl('VarRef_15', '"VarRef(odd?)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_15'), makeNodeDecl('Rands_15', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_15'), makeNodeDecl('AppExp_16', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_16'), makeNodeDecl('PrimOp_7', '"PrimOp(-)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_16'), makeNodeDecl('Rands_16', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_16'), makeNodeDecl('VarRef_16', '"VarRef(x)"')),
        makeEdge(makeNodeRef('Rands_16'), makeNodeDecl('NumExp_11', '"NumExp(1)"')),
        makeEdge(makeNodeRef('Bindings_3'), makeNodeDecl('Binding_8', 'Binding')),
        makeEdge(makeNodeRef('Binding_8'), makeNodeDecl('VarDecl_13', '"VarDecl(odd?)"'), 'var'),
        makeEdge(makeNodeRef('Binding_8'), makeNodeDecl('ProcExp_4', 'ProcExp'), 'val'),
        makeEdge(makeNodeRef('ProcExp_4'), makeNodeDecl('Params_4', ':'), 'args'),
        makeEdge(makeNodeRef('Params_4'), makeNodeDecl('VarDecl_14', '"VarDecl(x)"')),
        makeEdge(makeNodeRef('ProcExp_4'), makeNodeDecl('Body_6', ':'), 'body'),
        makeEdge(makeNodeRef('Body_6'), makeNodeDecl('IfExp_3', 'IfExp')),
        makeEdge(makeNodeRef('IfExp_3'), makeNodeDecl('AppExp_17', 'AppExp'), 'test'),
        makeEdge(makeNodeRef('AppExp_17'), makeNodeDecl('PrimOp_8', '"PrimOp(=)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_17'), makeNodeDecl('Rands_17', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_17'), makeNodeDecl('VarRef_17', '"VarRef(x)"')),
        makeEdge(makeNodeRef('Rands_17'), makeNodeDecl('NumExp_12', '"NumExp(0)"')),
        makeEdge(makeNodeRef('IfExp_3'), makeNodeDecl('BoolExp_2', '"BoolExp(#f)"'), 'then'),
        makeEdge(makeNodeRef('IfExp_3'), makeNodeDecl('AppExp_18', 'AppExp'), 'alt'),
        makeEdge(makeNodeRef('AppExp_18'), makeNodeDecl('VarRef_18', '"VarRef(even?)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_18'), makeNodeDecl('Rands_18', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_18'), makeNodeDecl('AppExp_19', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_19'), makeNodeDecl('PrimOp_9', '"PrimOp(-)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_19'), makeNodeDecl('Rands_19', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_19'), makeNodeDecl('VarRef_19', '"VarRef(x)"')),
        makeEdge(makeNodeRef('Rands_19'), makeNodeDecl('NumExp_13', '"NumExp(1)"')),
        makeEdge(makeNodeRef('LetrecExp_1'), makeNodeDecl('Body_7', ':'), 'body'),
        makeEdge(makeNodeRef('Body_7'), makeNodeDecl('AppExp_20', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_20'), makeNodeDecl('VarRef_20', '"VarRef(even?)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_20'), makeNodeDecl('Rands_20', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_20'), makeNodeDecl('VarRef_21', '"VarRef(x)"')),
        makeEdge(makeNodeRef('Body_7'), makeNodeDecl('AppExp_21', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_21'), makeNodeDecl('VarRef_22', '"VarRef(odd?)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_21'), makeNodeDecl('Rands_21', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_21'), makeNodeDecl('AppExp_22', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_22'), makeNodeDecl('PrimOp_10', '"PrimOp(+)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_22'), makeNodeDecl('Rands_22', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_22'), makeNodeDecl('VarRef_23', '"VarRef(x)"')),
        makeEdge(makeNodeRef('Rands_22'), makeNodeDecl('NumExp_14', '"NumExp(2)"')),
        makeEdge(makeNodeRef('Body_7'), makeNodeDecl('AppExp_23', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_23'), makeNodeDecl('VarRef_24', '"VarRef(even?)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_23'), makeNodeDecl('Rands_23', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_23'), makeNodeDecl('NumExp_15', '"NumExp(1)"')),
        makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('SetExp_1', 'SetExp')),
        makeEdge(makeNodeRef('SetExp_1'), makeNodeDecl('VarRef_25', '"VarRef(count-odds)"'), 'var'),
        makeEdge(makeNodeRef('SetExp_1'), makeNodeDecl('AppExp_24', 'AppExp'), 'val'),
        makeEdge(makeNodeRef('AppExp_24'), makeNodeDecl('VarRef_26', '"VarRef(f)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_24'), makeNodeDecl('Rands_24', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_24'), makeNodeDecl('NumExp_16', '"NumExp(8)"')),
        makeEdge(makeNodeRef('Exps_1'), makeNodeDecl('AppExp_25', 'AppExp')),
        makeEdge(makeNodeRef('AppExp_25'), makeNodeDecl('VarRef_27', '"VarRef(f)"'), 'rator'),
        makeEdge(makeNodeRef('AppExp_25'), makeNodeDecl('Rands_25', ':'), 'rands'),
        makeEdge(makeNodeRef('Rands_25'), makeNodeDecl('NumExp_17', '"NumExp(10)"')),
    ])));

const Mermaid_Program1_code =
`graph TD
Program_1[Program] -->|exps| Exps_1[:]
Exps_1 --> DefineExp_1[DefineExp]
DefineExp_1 -->|var| VarDecl_1["VarDecl(count-odds)"]
DefineExp_1 -->|val| ProcExp_1[ProcExp]
ProcExp_1 -->|args| Params_1[:]
Params_1 --> VarDecl_2["VarDecl(tree)"]
ProcExp_1 -->|body| Body_1[:]
Body_1 --> AppExp_1[AppExp]
AppExp_1 -->|rator| PrimOp_1["PrimOp(+)"]
AppExp_1 -->|rands| Rands_1[:]
Rands_1 --> VarRef_1["VarRef(x)"]
Rands_1 --> NumExp_1["NumExp(2)"]
Body_1 --> LetExp_1[LetExp]
LetExp_1 -->|bindings| Bindings_1[:]
Bindings_1 --> Binding_1[Binding]
Binding_1 -->|var| VarDecl_3["VarDecl(counter)"]
Binding_1 -->|val| AppExp_2[AppExp]
AppExp_2 -->|rator| VarRef_2["VarRef(make-counter)"]
AppExp_2 -->|rands| Rands_2[:]
Bindings_1 --> Binding_2[Binding]
Binding_2 -->|var| VarDecl_4["VarDecl(my-str)"]
Binding_2 -->|val| StrExp_1["StrExp(my-str-hello)"]
Bindings_1 --> Binding_3[Binding]
Binding_3 -->|var| VarDecl_5["VarDecl(em)"]
Binding_3 -->|val| LitExp_1[LitExp]
LitExp_1 -->|val| EmptySExp_1["EmptySExp"]
Bindings_1 --> Binding_4[Binding]
Binding_4 -->|var| VarDecl_6["VarDecl(sym)"]
Binding_4 -->|val| LitExp_2[LitExp]
LitExp_2 -->|val| SymbolSExp_1["SymbolSExp(ok-sym)"]
LetExp_1 -->|body| Body_2[:]
Body_2 --> AppExp_3[AppExp]
AppExp_3 -->|rator| VarRef_3["VarRef(loop)"]
AppExp_3 -->|rands| Rands_3[:]
Rands_3 --> VarRef_4["VarRef(tree)"]
Body_2 --> AppExp_4[AppExp]
AppExp_4 -->|rator| VarRef_5["VarRef(counter-get)"]
AppExp_4 -->|rands| Rands_4[:]
Rands_4 --> VarRef_6["VarRef(counter)"]
Exps_1 --> LetExp_2[LetExp]
LetExp_2 -->|bindings| Bindings_2[:]
Bindings_2 --> Binding_5[Binding]
Binding_5 -->|var| VarDecl_7["VarDecl(p1)"]
Binding_5 -->|val| AppExp_5[AppExp]
AppExp_5 -->|rator| VarRef_7["VarRef(make-pair)"]
AppExp_5 -->|rands| Rands_5[:]
Rands_5 --> NumExp_2["NumExp(1)"]
Rands_5 --> NumExp_3["NumExp(2)"]
Bindings_2 --> Binding_6[Binding]
Binding_6 -->|var| VarDecl_8["VarDecl(p2)"]
Binding_6 -->|val| AppExp_6[AppExp]
AppExp_6 -->|rator| VarRef_8["VarRef(make-pair)"]
AppExp_6 -->|rands| Rands_6[:]
Rands_6 --> NumExp_4["NumExp(3)"]
Rands_6 --> NumExp_5["NumExp(4)"]
LetExp_2 -->|body| Body_3[:]
Body_3 --> AppExp_7[AppExp]
AppExp_7 -->|rator| VarRef_9["VarRef(cmp-sexp)"]
AppExp_7 -->|rands| Rands_7[:]
Rands_7 --> LitExp_3[LitExp]
LitExp_3 -->|val| CompoundSExp_1[CompoundSExp]
CompoundSExp_1 -->|val1| number_1["number(1)"]
CompoundSExp_1 -->|val2| CompoundSExp_2[CompoundSExp]
CompoundSExp_2 -->|val1| number_2["number(3)"]
CompoundSExp_2 -->|val2| CompoundSExp_3[CompoundSExp]
CompoundSExp_3 -->|val1| boolean_1["boolean(#t)"]
CompoundSExp_3 -->|val2| CompoundSExp_4[CompoundSExp]
CompoundSExp_4 -->|val1| string_1["string(hi-there)"]
CompoundSExp_4 -->|val2| EmptySExp_2["EmptySExp"]
Body_3 --> AppExp_8[AppExp]
AppExp_8 -->|rator| PrimOp_2["PrimOp(+)"]
AppExp_8 -->|rands| Rands_8[:]
Rands_8 --> AppExp_9[AppExp]
AppExp_9 -->|rator| VarRef_10["VarRef(p1)"]
AppExp_9 -->|rands| Rands_9[:]
Rands_9 --> LitExp_4[LitExp]
LitExp_4 -->|val| SymbolSExp_2["SymbolSExp(car)"]
Rands_8 --> AppExp_10[AppExp]
AppExp_10 -->|rator| VarRef_11["VarRef(p2)"]
AppExp_10 -->|rands| Rands_10[:]
Rands_10 --> LitExp_5[LitExp]
LitExp_5 -->|val| SymbolSExp_3["SymbolSExp(cdr)"]
Exps_1 --> DefineExp_2[DefineExp]
DefineExp_2 -->|var| VarDecl_9["VarDecl(f)"]
DefineExp_2 -->|val| ProcExp_2[ProcExp]
ProcExp_2 -->|args| Params_2[:]
Params_2 --> VarDecl_10["VarDecl(x)"]
ProcExp_2 -->|body| Body_4[:]
Body_4 --> AppExp_11[AppExp]
AppExp_11 -->|rator| PrimOp_3["PrimOp(-)"]
AppExp_11 -->|rands| Rands_11[:]
Rands_11 --> IfExp_1[IfExp]
IfExp_1 -->|test| AppExp_12[AppExp]
AppExp_12 -->|rator| PrimOp_4["PrimOp(<)"]
AppExp_12 -->|rands| Rands_12[:]
Rands_12 --> VarRef_12["VarRef(x)"]
Rands_12 --> NumExp_6["NumExp(5)"]
IfExp_1 -->|then| NumExp_7["NumExp(8)"]
IfExp_1 -->|alt| AppExp_13[AppExp]
AppExp_13 -->|rator| PrimOp_5["PrimOp(+)"]
AppExp_13 -->|rands| Rands_13[:]
Rands_13 --> VarRef_13["VarRef(x)"]
Rands_13 --> NumExp_8["NumExp(9)"]
Rands_11 --> NumExp_9["NumExp(0)"]
Body_4 --> LetrecExp_1[LetrecExp]
LetrecExp_1 -->|bindings| Bindings_3[:]
Bindings_3 --> Binding_7[Binding]
Binding_7 -->|var| VarDecl_11["VarDecl(even?)"]
Binding_7 -->|val| ProcExp_3[ProcExp]
ProcExp_3 -->|args| Params_3[:]
Params_3 --> VarDecl_12["VarDecl(x)"]
ProcExp_3 -->|body| Body_5[:]
Body_5 --> IfExp_2[IfExp]
IfExp_2 -->|test| AppExp_14[AppExp]
AppExp_14 -->|rator| PrimOp_6["PrimOp(=)"]
AppExp_14 -->|rands| Rands_14[:]
Rands_14 --> VarRef_14["VarRef(x)"]
Rands_14 --> NumExp_10["NumExp(0)"]
IfExp_2 -->|then| BoolExp_1["BoolExp(#t)"]
IfExp_2 -->|alt| AppExp_15[AppExp]
AppExp_15 -->|rator| VarRef_15["VarRef(odd?)"]
AppExp_15 -->|rands| Rands_15[:]
Rands_15 --> AppExp_16[AppExp]
AppExp_16 -->|rator| PrimOp_7["PrimOp(-)"]
AppExp_16 -->|rands| Rands_16[:]
Rands_16 --> VarRef_16["VarRef(x)"]
Rands_16 --> NumExp_11["NumExp(1)"]
Bindings_3 --> Binding_8[Binding]
Binding_8 -->|var| VarDecl_13["VarDecl(odd?)"]
Binding_8 -->|val| ProcExp_4[ProcExp]
ProcExp_4 -->|args| Params_4[:]
Params_4 --> VarDecl_14["VarDecl(x)"]
ProcExp_4 -->|body| Body_6[:]
Body_6 --> IfExp_3[IfExp]
IfExp_3 -->|test| AppExp_17[AppExp]
AppExp_17 -->|rator| PrimOp_8["PrimOp(=)"]
AppExp_17 -->|rands| Rands_17[:]
Rands_17 --> VarRef_17["VarRef(x)"]
Rands_17 --> NumExp_12["NumExp(0)"]
IfExp_3 -->|then| BoolExp_2["BoolExp(#f)"]
IfExp_3 -->|alt| AppExp_18[AppExp]
AppExp_18 -->|rator| VarRef_18["VarRef(even?)"]
AppExp_18 -->|rands| Rands_18[:]
Rands_18 --> AppExp_19[AppExp]
AppExp_19 -->|rator| PrimOp_9["PrimOp(-)"]
AppExp_19 -->|rands| Rands_19[:]
Rands_19 --> VarRef_19["VarRef(x)"]
Rands_19 --> NumExp_13["NumExp(1)"]
LetrecExp_1 -->|body| Body_7[:]
Body_7 --> AppExp_20[AppExp]
AppExp_20 -->|rator| VarRef_20["VarRef(even?)"]
AppExp_20 -->|rands| Rands_20[:]
Rands_20 --> VarRef_21["VarRef(x)"]
Body_7 --> AppExp_21[AppExp]
AppExp_21 -->|rator| VarRef_22["VarRef(odd?)"]
AppExp_21 -->|rands| Rands_21[:]
Rands_21 --> AppExp_22[AppExp]
AppExp_22 -->|rator| PrimOp_10["PrimOp(+)"]
AppExp_22 -->|rands| Rands_22[:]
Rands_22 --> VarRef_23["VarRef(x)"]
Rands_22 --> NumExp_14["NumExp(2)"]
Body_7 --> AppExp_23[AppExp]
AppExp_23 -->|rator| VarRef_24["VarRef(even?)"]
AppExp_23 -->|rands| Rands_23[:]
Rands_23 --> NumExp_15["NumExp(1)"]
Exps_1 --> SetExp_1[SetExp]
SetExp_1 -->|var| VarRef_25["VarRef(count-odds)"]
SetExp_1 -->|val| AppExp_24[AppExp]
AppExp_24 -->|rator| VarRef_26["VarRef(f)"]
AppExp_24 -->|rands| Rands_24[:]
Rands_24 --> NumExp_16["NumExp(8)"]
Exps_1 --> AppExp_25[AppExp]
AppExp_25 -->|rator| VarRef_27["VarRef(f)"]
AppExp_25 -->|rands| Rands_25[:]
Rands_25 --> NumExp_17["NumExp(10)"]
`;