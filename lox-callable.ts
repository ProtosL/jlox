import { Interpreter } from "./interpreter";
import { Nullable } from "./type";

export interface LoxCallable {
    call: (interpreter: Interpreter, argumentList: Nullable<Object>[]) => Nullable<Object>
}