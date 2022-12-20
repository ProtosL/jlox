"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
const runtime_error_1 = require("./runtime-error");
const token_type_1 = require("./token-type");
const lox_1 = require("./lox");
const environment_1 = require("./environment");
const lox_callable_1 = require("./lox-callable");
const lox_function_1 = require("./lox-function");
const return_1 = require("./return");
const lox_class_1 = require("./lox-class");
const lox_instance_1 = require("./lox-instance");
class Interpreter {
    constructor() {
        /**
         * 最外层环境
         */
        this.globals = new environment_1.Environment();
        this.environment = this.globals;
        this.locals = new Map();
        /**
         * 定义全局函数 clock
         */
        this.globals.define('clock', {
            arity: () => {
                return 0;
            },
            call: (Interpreter, argumentList) => {
                return +new Date() / 1000;
            },
            toString: () => {
                return "<native fn>";
            }
        });
    }
    visitLiteralExpr(expr) {
        return expr.value;
    }
    visitLogicalExpr(expr) {
        const left = this.evaluate(expr.left);
        if (expr.operator.type === token_type_1.TokenType.OR) {
            // or 语句左侧为真时直接返回
            if (this.isTruthy(left)) {
                return left;
            }
        }
        else if (expr.operator.type === token_type_1.TokenType.AND) {
            // and 语句左侧为假时直接返回
            if (!this.isTruthy(left)) {
                return left;
            }
        }
        return this.evaluate(expr.right);
    }
    visitSetExpr(expr) {
        const object = this.evaluate(expr.object);
        if (!(object instanceof lox_instance_1.LoxInstance)) {
            throw new runtime_error_1.RuntimeError(expr.name, "Only instances have fields.");
        }
        const value = this.evaluate(expr.value);
        object.set(expr.name, value);
        return value;
    }
    visitSuperExpr(expr) {
        var _a;
        const distance = (_a = this.locals.get(expr)) !== null && _a !== void 0 ? _a : 1;
        const superclass = this.environment.getAt(distance, "super");
        const object = this.environment.getAt(distance - 1, "this");
        const method = superclass.findMethod(expr.method.lexeme);
        if (method === null) {
            throw new runtime_error_1.RuntimeError(expr.method, `Undefined property '${expr.method.lexeme}'.`);
        }
        return method.bind(object);
    }
    visitThisExpr(expr) {
        return this.lookUpVariable(expr.keyword, expr);
    }
    visitGroupingExpr(expr) {
        return this.evaluate(expr.expression);
    }
    visitUnaryExpr(expr) {
        const right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case token_type_1.TokenType.BANG:
                // 感叹号就取反
                return !this.isTruthy(right);
            case token_type_1.TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return -Number(right);
        }
        // Unreachable
        return null;
    }
    visitVariableExpr(expr) {
        return this.lookUpVariable(expr.name, expr);
    }
    lookUpVariable(name, expr) {
        const distance = this.locals.get(expr);
        if (distance !== undefined) {
            return this.environment.getAt(distance, name.lexeme);
        }
        else {
            return this.globals.get(name);
        }
    }
    checkNumberOperand(operator, operand) {
        if (typeof operand === 'number') {
            return;
        }
        throw new runtime_error_1.RuntimeError(operator, 'Operand must be a number');
    }
    visitBinaryExpr(expr) {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case token_type_1.TokenType.MINUS:
                return Number(left) - Number(right);
            case token_type_1.TokenType.PLUS:
                if (typeof left === 'number' && typeof right === 'number') {
                    return Number(left) + Number(right);
                }
                if (typeof left === 'string' && typeof right === 'string') {
                    return String(left) + String(right);
                }
                if (typeof left === 'string' && typeof right === 'number') {
                    return String(left) + String(right);
                }
                throw new runtime_error_1.RuntimeError(expr.operator, 'Operands must be two numbers or two strings.');
            case token_type_1.TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                if (right === 0) {
                    throw new runtime_error_1.RuntimeError(expr.operator, 'Right operand must not be zero.');
                }
                return Number(left) / Number(right);
            case token_type_1.TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) * Number(right);
            case token_type_1.TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) > Number(right);
            case token_type_1.TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) >= Number(right);
            case token_type_1.TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) < Number(right);
            case token_type_1.TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) <= Number(right);
            case token_type_1.TokenType.BANG_EQUAL:
                return !this.isEqual(left, right);
            case token_type_1.TokenType.EQUAL_EQUAL:
                return this.isEqual(left, right);
        }
        // Unreachable
        return null;
    }
    visitCallExpr(expr) {
        const callee = this.evaluate(expr.callee);
        const argumentList = [];
        expr.argumentList.forEach(argument => {
            argumentList.push(this.evaluate(argument));
        });
        if (!((0, lox_callable_1.instanceOfLoxCallable)(callee))) {
            throw new runtime_error_1.RuntimeError(expr.paren, "Can only call functions and classes.");
        }
        const func = callee;
        // 确保参数数量一致
        if (argumentList.length !== func.arity()) {
            throw new runtime_error_1.RuntimeError(expr.paren, `Expected ${func.arity()} arguments but got ${argumentList.length}.`);
        }
        return func.call(this, argumentList);
    }
    visitGetExpr(expr) {
        const object = this.evaluate(expr.object);
        if (object instanceof lox_instance_1.LoxInstance) {
            return object.get(expr.name);
        }
        throw new runtime_error_1.RuntimeError(expr.name, "Only instances have properties.");
    }
    visitExpressionStmt(stmt) {
        this.evaluate(stmt.expression);
        return;
    }
    visitFunctionStmt(stmt) {
        const fun = new lox_function_1.LoxFunction(stmt, this.environment, false);
        this.environment.define(stmt.name.lexeme, fun);
    }
    visitIfStmt(stmt) {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        }
        else {
            this.execute(stmt.elseBranch);
        }
        return;
    }
    visitPrintStmt(stmt) {
        const value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
        return;
    }
    visitReturnStmt(stmt) {
        let value = null;
        if (stmt.value !== null) {
            value = this.evaluate(stmt.value);
        }
        throw new return_1.Return(value);
    }
    visitVarStmt(stmt) {
        let value = null;
        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer);
        }
        this.environment.define(stmt.name.lexeme, value);
    }
    visitWhileStmt(stmt) {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
    }
    visitAssignExpr(expr) {
        const value = this.evaluate(expr.value);
        const distance = this.locals.get(expr);
        if (distance !== undefined) {
            this.environment.assignAt(distance, expr.name, value);
        }
        else {
            this.globals.assign(expr.name, value);
        }
        return value;
    }
    checkNumberOperands(operator, left, right) {
        if (typeof left === 'number' && typeof right === 'number') {
            return;
        }
        throw new runtime_error_1.RuntimeError(operator, 'Operands must be numbers');
    }
    isEqual(a, b) {
        if (a === null && b === null) {
            return true;
        }
        if (a === null) {
            return false;
        }
        return a === b;
    }
    /**
     * 判断传入的内容是否为真
     */
    isTruthy(object) {
        if (object === null) {
            return false;
        }
        if (typeof object === 'boolean') {
            return Boolean(object);
        }
        return true;
    }
    /**
     * 获取值
     * */
    evaluate(expr) {
        return expr.accept(this);
    }
    execute(stmt) {
        stmt === null || stmt === void 0 ? void 0 : stmt.accept(this);
    }
    resolve(expr, depth) {
        this.locals.set(expr, depth);
    }
    executeBlock(statements, environment) {
        const previous = this.environment;
        try {
            this.environment = environment;
            statements.forEach(statement => {
                this.execute(statement);
            });
        }
        finally {
            this.environment = previous;
        }
    }
    visitBlockStmt(stmt) {
        this.executeBlock(stmt.statements, new environment_1.Environment(this.environment));
    }
    visitClassStmt(stmt) {
        let superclass = null;
        if (stmt.superclass !== null) {
            superclass = this.evaluate(stmt.superclass);
            if (!(superclass instanceof lox_class_1.LoxClass)) {
                throw new runtime_error_1.RuntimeError(stmt.superclass.name, "Superclass must be a class.");
            }
        }
        this.environment.define(stmt.name.lexeme, null);
        if (stmt.superclass !== null) {
            this.environment = new environment_1.Environment(this.environment);
            this.environment.define("super", superclass);
        }
        const methods = new Map();
        stmt.methods.forEach(method => {
            const func = new lox_function_1.LoxFunction(method, this.environment, method.name.lexeme === "init");
            methods.set(method.name.lexeme, func);
        });
        const klass = new lox_class_1.LoxClass(stmt.name.lexeme, superclass, methods);
        if (superclass !== null) {
            this.environment = this.environment.enclosing;
        }
        this.environment.assign(stmt.name, klass);
    }
    interpret(statements) {
        try {
            statements.forEach(statement => {
                this.execute(statement);
            });
        }
        catch (error) {
            lox_1.Lox.runtimeError(error);
        }
    }
    /**
     * 转换为字符串
     */
    stringify(object) {
        if (object === null) {
            return 'nil';
        }
        if (typeof object === 'number') {
            let text = object.toString();
            return text;
        }
        return object.toString();
    }
}
exports.Interpreter = Interpreter;
