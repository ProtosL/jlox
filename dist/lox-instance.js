"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoxInstance = void 0;
const runtime_error_1 = require("./runtime-error");
class LoxInstance {
    constructor(klass) {
        this.fields = new Map();
        this.klass = klass;
    }
    get(name) {
        var _a;
        if (this.fields.has(name.lexeme)) {
            return (_a = this.fields.get(name.lexeme)) !== null && _a !== void 0 ? _a : null;
        }
        const method = this.klass.findMethod(name.lexeme);
        if (method !== null) {
            return method.bind(this);
        }
        throw new runtime_error_1.RuntimeError(name, `Undefined property '${name.lexeme}'`);
    }
    set(name, value) {
        this.fields.set(name.lexeme, value);
    }
    toString() {
        return `${this.klass.name} instance`;
    }
}
exports.LoxInstance = LoxInstance;
