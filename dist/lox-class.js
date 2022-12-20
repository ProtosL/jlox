"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoxClass = void 0;
const lox_instance_1 = require("./lox-instance");
class LoxClass {
    constructor(name, superclass, methods) {
        this.name = name;
        this.superclass = superclass;
        this.methods = methods;
    }
    findMethod(name) {
        var _a;
        if (this.methods.has(name)) {
            return (_a = this.methods.get(name)) !== null && _a !== void 0 ? _a : null;
        }
        // 在该实例中未找到该方法时向上查找
        if (this.superclass !== null) {
            return this.superclass.findMethod(name);
        }
        return null;
    }
    toString() {
        return this.name;
    }
    call(interpreter, argumentList) {
        const instance = new lox_instance_1.LoxInstance(this);
        const initializer = this.findMethod("init");
        if (initializer !== null) {
            initializer.bind(instance).call(interpreter, argumentList);
        }
        return instance;
    }
    arity() {
        const initializer = this.findMethod("init");
        if (initializer === null) {
            return 0;
        }
        return initializer.arity();
    }
}
exports.LoxClass = LoxClass;
