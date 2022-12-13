import { Stmt } from "./lib/stmt";
import { LoxCallable } from "./lox-callable";
import { Interpreter } from './interpreter';
import { Environment } from './environment';
import { Nullable } from "./type";
import { LoxInstance } from './lox-instance';

export class LoxFunction implements LoxCallable {
    private readonly declaration: Stmt.Function;
    private readonly closure: Environment;
    private readonly isInitializer: boolean;

    constructor(declaration: Stmt.Function, closure: Environment, isInitializer: boolean) {
        this.closure = closure;
        this.declaration = declaration;
        this.isInitializer = isInitializer;
    }

    bind(instance: LoxInstance): LoxFunction {
        const enviroment: Environment = new Environment(this.closure);
        enviroment.define("this", instance);
        return new LoxFunction(this.declaration, enviroment, this.isInitializer);
    }

    public toString(): string {
        return `<fn ${this.declaration.name.lexeme}>`;
    }

    public arity(): number {
        return this.declaration.params.length;
    };

    public call(interpreter: Interpreter, argumentList: Nullable<Object>[]) {
        const environment: Environment = new Environment(this.closure);
        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(this.declaration.params[i].lexeme, argumentList[i]);
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (returnValue: any) {
            return returnValue.value;            
        }

        if (this.isInitializer) {
            return this.closure.getAt(0, "this");
        }
        return null;
    }
}