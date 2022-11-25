import { Nullable } from "./type";
import { Token } from './token';

export class Environment {
    readonly enclosing: Nullable<Environment> = null;
    private readonly values: Map<string, Nullable<Object>> = new Map();

    constructor(enclosing?: Environment) {
        if (enclosing) {
            this.enclosing = enclosing;
        }
    }

    /**
     * 获取变量的值，不存在则返回 null
     */
    get(name: Token): Nullable<Object> {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme) || null;
        }

        if (this.enclosing !== null) {
            return this.enclosing.get(name);
        }

        throw new Error(`Undefined variable ${name.lexeme}.`);
    }

    /**
     * 对变量进行赋值，变量不存在则抛出异常
     */
    assign(name: Token, value: Nullable<Object>) {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }

        if (this.enclosing !== null) {
            this.enclosing.assign(name, value);
            return;
        }

        throw new Error(`Undefined variable '${name.lexeme}'.`);
    }

    define(name: string, value: Nullable<Object>) {
        this.values.set(name, value);
    }
}