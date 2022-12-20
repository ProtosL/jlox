"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
const runtime_error_1 = require("./runtime-error");
class Environment {
    constructor(enclosing) {
        this.enclosing = null;
        this.values = new Map();
        if (enclosing) {
            this.enclosing = enclosing;
        }
    }
    /**
     * 获取变量的值，不存在则返回 null
     */
    get(name) {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme);
        }
        if (this.enclosing !== null) {
            return this.enclosing.get(name);
        }
        throw new runtime_error_1.RuntimeError(name, `Undefined variable ${name.lexeme}.`);
    }
    /**
     * 对变量进行赋值，变量不存在则抛出异常
     */
    assign(name, value) {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }
        if (this.enclosing !== null) {
            this.enclosing.assign(name, value);
            return;
        }
        throw new runtime_error_1.RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }
    define(name, value) {
        this.values.set(name, value);
    }
    ancestor(distance) {
        let environment = this;
        for (let i = 0; i < distance; i++) {
            environment = environment.enclosing;
        }
        return environment;
    }
    getAt(distance, name) {
        var _a;
        return (_a = this.ancestor(distance).values.get(name)) !== null && _a !== void 0 ? _a : null;
    }
    assignAt(distance, name, value) {
        this.ancestor(distance).values.set(name.lexeme, value);
    }
}
exports.Environment = Environment;
