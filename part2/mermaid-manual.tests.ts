// const mapL4ExpToMermaid = (exp: Exp): Result<GraphContent> =>
//         isNumExp(exp) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUniqueNumExpId(), exp.val.toString()))) :
//         isVarRef(exp) ? makeOk(makeAtomicGraph(makeNodeDecl(makeUniqueVarRefId(), exp.var))) :
//         isVarDecl(exp) ? f(exp) :
//         isProcExp(exp) ? makeOk(makeCompoundGraph([
//             makeEdge(makeNodeDecl("ProcExp_1", "ProcExp"), makeNodeDecl("Params_1", ":"), "args"),
//             makeEdge(makeNodeRef("ProcExp_1"), makeNodeDecl("Body_1", ":"), "body"),
//             makeEdge(makeNodeRef("Params_1"), makeNodeDecl("VarDecl_1", "VarDecl(x)")),
//             makeEdge(makeNodeRef("Params_1"), makeNodeDecl("VarDecl_2", "VarDecl(y)")),
//             makeEdge(makeNodeRef("Body_1"), makeNodeDecl("NumExp_2", "NumExp(8)")),
//             makeEdge(makeNodeRef("Body_1"), makeNodeDecl("VarRef_1", "VarRef(x)")),
//         ])) :
//         makeFailure("");
// const a = mapL4toMermaid(
//     makeProgram([makeProcExp([makeVarDecl("x")], [makeNumExp(6)]), makeNumExp(5)])
// );
// console.log(JSON.stringify(a));
// console.log();