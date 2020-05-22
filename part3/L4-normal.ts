// ========================================================
// L4 normal eval
import { Sexp } from "s-expression";
//import { map } from "ramda";
import { CExp, Exp, IfExp, Program, parseL4Exp, DefineExp, isLetExp, isLetrecExp, isSetExp, ProcExp, LetExp, Binding, AppExp, PrimOp, VarDecl, VarRef } from "./L4-ast";
import { isAppExp, isBoolExp, isCExp, isDefineExp, isIfExp, isLitExp, isNumExp,
         isPrimOp, isProcExp, isStrExp, isVarRef } from "./L4-ast";
import { applyEnv, makeEmptyEnv, Env, makeExtEnv, makeRecEnv, applyRecEnv, isRecEnv } from './L4-env-normal';
import { applyPrimitive } from "./evalPrimitive";
import { isClosure, makeClosure, Value, isPromise, makePromise, Closure } from "./L4-value";
import { first, rest, isEmpty } from '../shared/list';
import { Result, makeOk, makeFailure, bind, mapResult } from "../shared/result";
import { parse as p } from "../shared/parser";
import { map } from "ramda";

type EvalFunc = (exp: CExp, env: Env) => Result<Value>;

// Evaluate a sequence of expressions (in a program)
export const evalExps = (exps: Exp[], env: Env): Result<Value> =>
    normalEvalProgramExps(exps, env);

export const evalNormalProgram = (program: Program): Result<Value> =>
    evalExps(program.exps, makeEmptyEnv());

export const evalNormalParse = (s: string): Result<Value> =>
    bind(p(s),
         (parsed: Sexp) => bind(parseL4Exp(parsed),
                                (exp: Exp) => evalExps([exp], makeEmptyEnv())));

const isTrueValue = (x: Value): boolean =>
    !(x === false);

const normalEvalProgramExps = (exps: Exp[], env: Env): Result<Value> =>
    isEmpty(exps) ? makeFailure("Empty sequence") :
    normalEvalProgramNonEmptyExps(exps, env);

const normalEvalProgramNonEmptyExps = (exps: Exp[], env: Env): Result<Value> => {
    const firstExp = first(exps);
    return isDefineExp(firstExp) ? normalEvalDefineExp(firstExp, rest(exps), env) :
        normalEvalProgramCExps(firstExp, rest(exps), env);
};

const normalEvalProgramCExps = (first: CExp, rest: Exp[], env: Env): Result<Value> =>
    isEmpty(rest) ? normalEvalCExp(first, env) :
    bind(normalEvalCExp(first, env), _ => normalEvalProgramExps(rest, env))

const normalEvalCExpsSequence = (exps: CExp[], env: Env, evalFunc: EvalFunc): Result<Value> =>
    isEmpty(exps) ? makeFailure("Empty expression sequence") :
    isEmpty(rest(exps)) ? evalFunc(first(exps), env) :
    bind(evalFunc(first(exps), env), _ => normalEvalCExpsSequence(rest(exps), env, evalFunc));

const normalEvalDefineExp = (def: DefineExp, rest: Exp[], env: Env): Result<Value> =>
    isProcExp(def.val) ? normalEvalDefineExpProc(def.var.var, def.val, rest, env) :
    normalEvalDefineExpNonProc(def, rest, env);

const normalEvalDefineExpProc = (varName: string, proc: ProcExp, rest: Exp[], env: Env): Result<Value> => {
    const recEnv: Env = makeRecEnv([varName], [proc.args], [proc.body], env);
    const extEnv: Env = makeExtEnv([varName], [makePromise(proc, recEnv)], env);
    return normalEvalProgramExps(rest, extEnv);
};

const normalEvalDefineExpNonProc = (def: DefineExp, rest: Exp[], env: Env): Result<Value> => {
    const extEnv: Env = makeExtEnv([def.var.var], [makePromise(def.val, env)], env);
    return normalEvalProgramExps(rest, extEnv);
};

const normalEvalCExp = (exp: CExp, env: Env): Result<Value> =>
    isNumExp(exp) ? makeOk(exp.val) :
    isBoolExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isLitExp(exp) ? makeOk(exp.val) :
    isVarRef(exp) ? normalEvalVarRef(exp, env) :
    isIfExp(exp) ? normalEvalIfExp(exp, env, normalEvalCExp) :
    isProcExp(exp) ? normalEvalProcExp(exp, env) :
    isLetExp(exp) ? normalEvalLetExp(exp, env, normalEvalCExp) :
    isAppExp(exp) ? normalEvalAppExp(exp, env) :
    isLetrecExp(exp) ? makeFailure("Letrec expression is unsupported") :
    isSetExp(exp) ? makeFailure("Set expression is unsupported") :
    makeFailure(`Unexpected expression ${exp}`);

const normalFullyEvalCExp = (exp: CExp, env: Env): Result<Value> =>
    isNumExp(exp) ? makeOk(exp.val) :
    isBoolExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isLitExp(exp) ? makeOk(exp.val) :
    isVarRef(exp) ? normalFullyEvalVarRef(exp, env) :
    isIfExp(exp) ? normalEvalIfExp(exp, env, normalFullyEvalCExp) :
    isProcExp(exp) ? normalEvalProcExp(exp, env) :
    isLetExp(exp) ? normalEvalLetExp(exp, env, normalFullyEvalCExp) :
    isAppExp(exp) ? normalEvalAppExp(exp, env) :
    isLetrecExp(exp) ? makeFailure("Letrec expression is unsupported") :
    isSetExp(exp) ? makeFailure("Set expression is unsupported") :
    makeFailure(`Unexpected expression ${exp}`);

const normalEvalVarRef = (varRef: VarRef, env: Env): Result<Value> =>
    bind(applyEnv(env, varRef.var), (p: Value): Result<Value> =>
        isPromise(p) ? (
            isAppExp(p.exp) ? makeOk(p) :
            isProcExp(p.exp) ? (
                isRecEnv(p.env) ? applyRecEnv(p.env, varRef.var) :
                // have to be from a define expression, therefore it must come from a recursive environment
                makeFailure("Promise env of defined var (from DefineExp) of Proc exp is not recursive")
            ) :
            normalEvalCExp(p.exp, p.env)
        ) :
        makeFailure("Var in global enviroment does not map to a promise")
    );

const normalFullyEvalVarRef = (varRef: VarRef, env: Env): Result<Value> =>
    bind(applyEnv(env, varRef.var), (val: Value): Result<Value> =>
        isPromise(val) ? (
            isProcExp(val.exp) && isRecEnv(val.env) ? applyRecEnv(val.env, varRef.var) :
            normalFullyEvalCExp(val.exp, val.env)
        ) :
        isClosure(val) ? makeOk(val) :
        makeFailure("Var in function maps to an actual value, send help")
    );

const normalEvalIfExp = (ifExp: IfExp, env: Env, evalFunc: EvalFunc): Result<Value> =>
    bind(
        normalFullyEvalCExp(ifExp.test, env),
        (value: Value) => evalFunc(isTrueValue(value) ? ifExp.then : ifExp.alt, env)
    );

const normalEvalProcExp = (procExp: ProcExp, env: Env): Result<Value> =>
    makeOk(makeClosure(procExp.args, procExp.body, env));

const normalEvalLetExp = (letExp: LetExp, env: Env, evalFunc: EvalFunc): Result<Value> => {
    const extEnv: Env = makeExtEnv(
        map((binding: Binding) => binding.var.var, letExp.bindings),
        map((binding: Binding) => makePromise(binding.val, env), letExp.bindings),
        env
    );
    return normalEvalCExpsSequence(letExp.body, extEnv, evalFunc);
};

const normalEvalAppExp = (appExp: AppExp, env: Env): Result<Value> =>
    bind(normalFullyEvalCExp(appExp.rator, env), (rator: Value): Result<Value> =>
        isPrimOp(rator) ? normalEvalApplyPrimOp(rator, appExp.rands, env) :
        isClosure(rator) ? normalEvalApplyClosure(rator, appExp.rands, env) :
        makeFailure(`Bad rator ${rator}`)
    );

const normalEvalApplyPrimOp = (op: PrimOp, randExps: CExp[], env: Env): Result<Value> =>
    bind(
        mapResult((exp: CExp) => normalFullyEvalCExp(exp, env), randExps),
        (randVals: Value[]) => applyPrimitive(op, randVals)
    );

const normalEvalApplyClosure = (closure: Closure, randExps: CExp[], env: Env): Result<Value> => {
    const extEnv: Env = makeExtEnv(
        map((paramDecl: VarDecl) => paramDecl.var, closure.params),
        map((exp: CExp) => makePromise(exp, env), randExps),
        closure.env
    );
    return normalEvalCExpsSequence(closure.body, extEnv, normalFullyEvalCExp);
};