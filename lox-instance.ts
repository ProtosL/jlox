import { LoxClass } from './lox-class';
import { Token } from './token';
import { Nullable } from './type';
import { RuntimeError } from './runtime-error';
import { LoxFunction } from './lox-function';

export class LoxInstance {
    private klass: LoxClass;
    private readonly fields: Map<string, Nullable<Object>> = new Map();    

    constructor(klass: LoxClass) {
        this.klass = klass;
    }

    get(name: Token): Nullable<Object> {
        if (this.fields.has(name.lexeme)) {
            return this.fields.get(name.lexeme) ?? null;
        }

        const method: Nullable<LoxFunction> = this.klass.findMethod(name.lexeme);
        if (method !== null) {
            return method;
        }

        throw new RuntimeError(name, `Undefined property '${name.lexeme}'`);
    }

    set(name: Token, value: Nullable<Object>) {
        this.fields.set(name.lexeme, value);
    }

    public toString() {
        return `${this.klass.name} instance`;
    }
}