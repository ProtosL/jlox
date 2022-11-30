import { Interpreter } from "./interpreter";
import { Nullable } from "./type";

export interface LoxCallable {
    call: (interpreter: Interpreter, argumentList: Nullable<Object>[]) => Nullable<Object>
}

export const instanceOfLoxCallable = (object: any): object is LoxCallable => {
    return 'call' in object;
}