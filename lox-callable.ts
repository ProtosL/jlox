import { Interpreter } from "./interpreter";
import { Nullable } from "./type";

export interface LoxCallable {
    /**
     * 函数期望的参数数量
     */
    arity: () => number; 
    call: (interpreter: Interpreter, argumentList: Nullable<Object>[]) => Nullable<Object>
}

export const instanceOfLoxCallable = (object: any): object is LoxCallable => {
    return 'call' in object;
}