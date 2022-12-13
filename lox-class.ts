import { Interpreter } from './interpreter';
import { Nullable } from './type';
import { LoxInstance } from './lox-instance';
import { LoxCallable } from './lox-callable';

export class LoxClass implements LoxCallable {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    public toString(): string {
        return this.name;
    }

    public call(interpreter: Interpreter, argumentList: Nullable<Object>[]) {
        const instance: LoxInstance = new LoxInstance(this);
        console.log(instance.toString())
        return instance;
    }

    public arity(): number {
        return 0;
    }
}