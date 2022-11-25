import { Nullable } from "./type";
import { Token } from './token';

export class Environment {
    private readonly values: Map<string, Nullable<Object>> = new Map();

    get(name: Token) {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme);
        }

        throw new Error(`Undefined variable ${name.lexeme}.`);
    }

    define(name: string, value: Nullable<Object>) {
        this.values.set(name, value);
    }
}