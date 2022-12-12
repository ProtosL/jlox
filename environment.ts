import { Nullable } from "./type";
import { Token } from './token';
import { RuntimeError } from './runtime-error';

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
            return this.values.get(name.lexeme) as Object;
        }

        if (this.enclosing !== null) {
            return this.enclosing.get(name);
        }

        throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
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

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    define(name: string, value: Nullable<Object>) {
        this.values.set(name, value);
    }

    ancestor(distance: number): Environment {
        let environment = this as Environment;
        for (let i = 0; i < distance; i++) {
            environment = environment.enclosing as Environment;
        }

        return environment;
    }
    
    getAt(distance: number, name: string): Nullable<Object> {
        return this.ancestor(distance).values.get(name) || null;
    }
}