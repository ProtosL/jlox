"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = void 0;
const lox_1 = require("./lox");
var EFunctionType;
(function (EFunctionType) {
    EFunctionType[EFunctionType["NONE"] = 0] = "NONE";
    EFunctionType[EFunctionType["FUNCTION"] = 1] = "FUNCTION";
    EFunctionType[EFunctionType["INITIALIZER"] = 2] = "INITIALIZER";
    EFunctionType[EFunctionType["METHOD"] = 3] = "METHOD";
})(EFunctionType || (EFunctionType = {}));
var EClassType;
(function (EClassType) {
    EClassType[EClassType["NONE"] = 0] = "NONE";
    EClassType[EClassType["CLASS"] = 1] = "CLASS";
    EClassType[EClassType["SUBCLASS"] = 2] = "SUBCLASS";
})(EClassType || (EClassType = {}));
class Resolver {
    constructor(interpreter) {
        this.scopes = [];
        /**
         * 当前访问的代码是否在函数声明中
         */
        this.currentFunction = EFunctionType.NONE;
        this.currentClass = EClassType.NONE;
        this.interpreter = interpreter;
    }
    visitBlockStmt(stmt) {
        this.beginScope();
        this.resolveStatements(stmt.statements);
        this.endScope();
    }
    visitClassStmt(stmt) {
        const enclosingClass = this.currentClass;
        this.currentClass = EClassType.CLASS;
        this.declare(stmt.name);
        this.define(stmt.name);
        // 避免 class Oops < Oops {} 这种继承自己的情况
        if (stmt.superclass !== null && stmt.name.lexeme === stmt.superclass.name.lexeme) {
            lox_1.Lox.error(stmt.superclass.name, "A class can't inherit from itself.");
        }
        if (stmt.superclass !== null) {
            this.currentClass = EClassType.SUBCLASS;
            this.resolveExpr(stmt.superclass);
        }
        if (stmt.superclass !== null) {
            this.beginScope();
            this.peekScopes().set("super", true);
        }
        this.beginScope();
        this.peekScopes().set("this", true);
        stmt.methods.forEach(method => {
            let declaration = EFunctionType.METHOD;
            if (method.name.lexeme === 'init') {
                declaration = EFunctionType.INITIALIZER;
            }
            this.resolveFunction(method, declaration);
        });
        this.endScope();
        if (stmt.superclass !== null) {
            this.endScope();
        }
        this.currentClass = enclosingClass;
    }
    visitExpressionStmt(stmt) {
        this.resolveExpr(stmt.expression);
    }
    visitFunctionStmt(stmt) {
        this.declare(stmt.name);
        this.define(stmt.name);
        this.resolveFunction(stmt, EFunctionType.FUNCTION);
    }
    visitIfStmt(stmt) {
        this.resolveExpr(stmt.condition);
        this.resolveStatement(stmt.thenBranch);
        // 不管条件，有就解析
        if (stmt.elseBranch !== null) {
            this.resolveStatement(stmt.elseBranch);
        }
    }
    visitPrintStmt(stmt) {
        this.resolveExpr(stmt.expression);
    }
    visitReturnStmt(stmt) {
        if (this.currentFunction === EFunctionType.NONE) {
            lox_1.Lox.error(stmt.keyword, "Can't return from top-level code.");
        }
        if (stmt.value !== null) {
            if (this.currentFunction === EFunctionType.INITIALIZER) {
                lox_1.Lox.error(stmt.keyword, "Can't return a value from an initializer.");
            }
            this.resolveExpr(stmt.value);
        }
    }
    visitWhileStmt(stmt) {
        this.resolveExpr(stmt.condition);
        this.resolveStatement(stmt.body);
    }
    visitBinaryExpr(expr) {
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }
    visitCallExpr(expr) {
        this.resolveExpr(expr.callee);
        expr.argumentList.forEach(argument => {
            this.resolveExpr(argument);
        });
    }
    visitGetExpr(expr) {
        this.resolveExpr(expr.object);
    }
    visitGroupingExpr(expr) {
        this.resolveExpr(expr.expression);
    }
    visitLiteralExpr(expr) {
        return;
    }
    visitLogicalExpr(expr) {
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }
    visitSetExpr(expr) {
        this.resolveExpr(expr.value);
        this.resolveExpr(expr.object);
    }
    visitSuperExpr(expr) {
        if (this.currentClass === EClassType.NONE) {
            lox_1.Lox.error(expr.keyword, "Can't use 'super' outside of a class.");
        }
        else if (this.currentClass !== EClassType.SUBCLASS) {
            lox_1.Lox.error(expr.keyword, "Can't use 'super' in a class with no superclass.");
        }
        this.resolveLocal(expr, expr.keyword);
    }
    visitThisExpr(expr) {
        if (this.currentClass === EClassType.NONE) {
            lox_1.Lox.error(expr.keyword, "Cant't use 'this' outside of a class.");
            return;
        }
        this.resolveLocal(expr, expr.keyword);
    }
    visitUnaryExpr(expr) {
        this.resolveExpr(expr.right);
    }
    visitVarStmt(stmt) {
        this.declare(stmt.name);
        if (stmt.initializer !== null) {
            this.resolveExpr(stmt.initializer);
        }
        this.define(stmt.name);
    }
    visitAssignExpr(expr) {
        this.resolveExpr(expr.value);
        this.resolveLocal(expr, expr.name);
    }
    visitVariableExpr(expr) {
        var _a;
        // 如果当前变量存在于当前作用域中，但值是 false，表示已经声明了但还未定义，抛出错误
        if (!this.scopes.length && ((_a = this.peekScopes()) === null || _a === void 0 ? void 0 : _a.get(expr.name.lexeme)) === false) {
            lox_1.Lox.error(expr.name, "Can't read local variable in its own initializer.");
        }
        this.resolveLocal(expr, expr.name);
    }
    resolveStatements(statements) {
        statements.forEach(statement => {
            this.resolveStatement(statement);
        });
    }
    resolveStatement(stmt) {
        stmt.accept(this);
    }
    resolveExpr(expr) {
        expr.accept(this);
    }
    resolveFunction(func, type) {
        const enclosingFunction = this.currentFunction;
        this.currentFunction = type;
        this.beginScope();
        func.params.forEach((param) => {
            this.declare(param);
            this.define(param);
        });
        this.resolveStatements(func.body);
        this.endScope();
        this.currentFunction = enclosingFunction;
    }
    beginScope() {
        this.scopes.push(new Map());
    }
    endScope() {
        this.scopes.pop();
    }
    declare(name) {
        if (!this.scopes.length) {
            return;
        }
        const scope = this.peekScopes();
        if (scope.get(name.lexeme)) {
            lox_1.Lox.error(name, "Already a variable with this name in this scope.");
        }
        // 设置为 false，表示该变量还未准备好
        scope.set(name.lexeme, false);
    }
    define(name) {
        if (!this.scopes.length) {
            return;
        }
        this.peekScopes().set(name.lexeme, true);
    }
    resolveLocal(expr, name) {
        // 从最内层开始，
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name.lexeme)) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
                return;
            }
        }
    }
    /**
     * 获取 scopes 中最后一个元素
     */
    peekScopes() {
        return this.scopes[this.scopes.length - 1];
    }
}
exports.Resolver = Resolver;
