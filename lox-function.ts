import { Stmt } from "./lib/stmt";
import { LoxCallable } from "./lox-callable";
import { Interpreter } from './interpreter';
import { Environment } from './environment';
import { Nullable } from "./type";

export class LoxFunction implements LoxCallable {
    private readonly declaration: Stmt.Function;

    constructor(declaration: Stmt.Function) {
        this.declaration = declaration;
    }

    public toString(): string {
        return `<fn ${this.declaration.name.lexeme}>`;
    }

    public arity(): number {
        return this.declaration.params.length;
    };

    public call(interpreter: Interpreter, argumentList: Nullable<Object>[]) {
        const environment: Environment = new Environment(interpreter.globals);
        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(this.declaration.params[i].lexeme, argumentList[i]);
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (returnValue: any) {
            return returnValue.value;            
        }
        return null;
    }
}