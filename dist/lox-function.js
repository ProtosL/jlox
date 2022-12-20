"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoxFunction = void 0;
const environment_1 = require("./environment");
class LoxFunction {
    constructor(declaration, closure, isInitializer) {
        this.closure = closure;
        this.declaration = declaration;
        this.isInitializer = isInitializer;
    }
    bind(instance) {
        const enviroment = new environment_1.Environment(this.closure);
        enviroment.define("this", instance);
        return new LoxFunction(this.declaration, enviroment, this.isInitializer);
    }
    toString() {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
    arity() {
        return this.declaration.params.length;
    }
    ;
    call(interpreter, argumentList) {
        const environment = new environment_1.Environment(this.closure);
        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(this.declaration.params[i].lexeme, argumentList[i]);
        }
        try {
            interpreter.executeBlock(this.declaration.body, environment);
        }
        catch (returnValue) {
            if (this.isInitializer) {
                return this.closure.getAt(0, "this");
            }
            return returnValue.value;
        }
        if (this.isInitializer) {
            return this.closure.getAt(0, "this");
        }
        return null;
    }
}
exports.LoxFunction = LoxFunction;
