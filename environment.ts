import { Nullable } from "./type";
import { Token } from './token';

export class Environment {
    private readonly values: Map<string, Nullable<Object>> = new Map();

    /**
     * 获取变量的值，不存在则返回 null
     */
    get(name: Token) {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme) || null;
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

        throw new Error(`Undefined variable '${name.lexeme}'.`);
    }

    define(name: string, value: Nullable<Object>) {
        this.values.set(name, value);
    }
}