// ========================================================
// Value type definition for L4

import { isPrimOp, CExp, PrimOp, VarDecl } from './L4-ast';
import { Env } from './L4-env-normal';
import { append } from 'ramda';
import { isArray, isNumber, isString } from '../shared/type-predicates';

export type Value = SExpValue | Closure | Promise;

export type Functional = PrimOp | Closure;
export const isFunctional = (x: any): x is Functional => isPrimOp(x) || isClosure(x);

// ========================================================
// Closure for L4 - the field env is added.
// We also use a frame-based representation of closures as opposed to one env per var.
export interface Closure {
    tag: "Closure";
    params: VarDecl[];
    body: CExp[];
    env: Env;
}
export const makeClosure = (params: VarDecl[], body: CExp[], env: Env): Closure =>
    ({tag: "Closure", params: params, body: body, env: env});
export const isClosure = (x: any): x is Closure => x.tag === "Closure";

// ========================================================
// Promise
export interface Promise {
    tag: "Promise";
    exp: CExp;
    env: Env;
}
export const makePromise = (exp: CExp, env: Env): Promise =>
    ({tag: "Promise", exp: exp, env: env});
export const isPromise = (x: any): x is Promise => x.tag == "Promise";

// ========================================================
// SExp
export interface CompoundSExp {
    tag: "CompoundSexp";
    val1: SExpValue;
    val2: SExpValue;
}
export interface EmptySExp {
    tag: "EmptySExp";
}
export interface SymbolSExp {
    tag: "SymbolSExp";
    val: string;
}

export type SExpValue = number | boolean | string | PrimOp | Closure | Promise | SymbolSExp | EmptySExp | CompoundSExp;
export const isSExp = (x: any): x is SExpValue =>
    typeof(x) === 'string' || typeof(x) === 'boolean' || typeof(x) === 'number' ||
    isSymbolSExp(x) || isCompoundSExp(x) || isEmptySExp(x) || isPrimOp(x) || isClosure(x) || isPromise(x);

export const makeCompoundSExp = (val1: SExpValue, val2: SExpValue): CompoundSExp =>
    ({tag: "CompoundSexp", val1: val1, val2 : val2});
export const isCompoundSExp = (x: any): x is CompoundSExp => x.tag === "CompoundSexp";

export const makeEmptySExp = (): EmptySExp => ({tag: "EmptySExp"});
export const isEmptySExp = (x: any): x is EmptySExp => x.tag === "EmptySExp";

export const makeSymbolSExp = (val: string): SymbolSExp =>
    ({tag: "SymbolSExp", val: val});
export const isSymbolSExp = (x: any): x is SymbolSExp => x.tag === "SymbolSExp";

// LitSExp are equivalent to JSON - they can be parsed and read as literal values
// like SExp except that non functional values (PrimOp and Closures) can be embedded at any level.
export type LitSExp = number | boolean | string | SymbolSExp | EmptySExp | CompoundSExp;

// Printable form for values
export const closureToString = (c: Closure): string =>
    // `<Closure ${c.params} ${L3unparse(c.body)}>`
    `<Closure ${c.params} ${c.body}>`

export const compoundSExpToArray = (cs: CompoundSExp, res: string[]): string[] | { s1: string[], s2: string } =>
    isEmptySExp(cs.val2) ? append(valueToString(cs.val1), res) :
    isCompoundSExp(cs.val2) ? compoundSExpToArray(cs.val2, res.concat([valueToString(cs.val1)])) :
    ({ s1: res.concat([valueToString(cs.val1)]), s2: valueToString(cs.val2)})

export const compoundSExpToString = (cs: CompoundSExp, css = compoundSExpToArray(cs, [])): string =>
    isArray(css) ? `(${css.join(' ')})` :
    `(${css.s1.join(' ')} . ${css.s2})`

export const valueToString = (val: Value): string =>
    isNumber(val) ?  val.toString() :
    val === true ? '#t' :
    val === false ? '#f' :
    isString(val) ? `"${val}"` :
    isClosure(val) ? closureToString(val) :
    isPrimOp(val) ? val.op :
    isSymbolSExp(val) ? val.val :
    isEmptySExp(val) ? "'()" :
    isCompoundSExp(val) ? compoundSExpToString(val) :
    isPromise(val) ? `<Promise ${JSON.stringify(val.exp)} ${val.env.tag}>` :
    "Error: unknown value type "+val
