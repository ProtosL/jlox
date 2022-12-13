import { LoxClass } from './lox-class';
import { Token } from './token';
import { Nullable } from './type';
import { RuntimeError } from './runtime-error';

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

        throw new RuntimeError(name, `Undefined property '${name.lexeme}'`);
    }

    public toString() {
        return `${this.klass.name} instance`;
    }
}