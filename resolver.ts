import { Expr } from './lib/expr';
import { Stmt } from './lib/stmt';
import { Interpreter } from './interpreter';
import { Token } from './token';
import { Lox } from './lox';

enum EFunctionType {
    NONE,
    FUNCTION,
    INITIALIZER,
    METHOD
}

enum EClassType {
    NONE,
    CLASS,
    SUBCLASS
}

export class Resolver implements Expr.Visitor<void>, Stmt.Visitor<void> {
    private readonly interpreter: Interpreter;
    private readonly scopes: Map<string, boolean>[] = [];
    /**
     * 当前访问的代码是否在函数声明中
     */
    private currentFunction: EFunctionType = EFunctionType.NONE;
    private currentClass: EClassType = EClassType.NONE;

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter;
    }

    public visitBlockStmt(stmt: Stmt.Block): void {
        this.beginScope();
        this.resolveStatements(stmt.statements);
        this.endScope();
    }

    public visitClassStmt(stmt: Stmt.Class): void {
        const enclosingClass = this.currentClass;
        this.currentClass = EClassType.CLASS;
        
        this.declare(stmt.name);
        this.define(stmt.name);

        // 避免 class Oops < Oops {} 这种继承自己的情况
        if (stmt.superclass !== null && stmt.name.lexeme === stmt.superclass.name.lexeme) {
            Lox.error(stmt.superclass.name, "A class can't inherit from itself.");
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
        })

        this.endScope();

        if (stmt.superclass !== null) {
            this.endScope();
        }
        
        this.currentClass = enclosingClass;
    }

    public visitExpressionStmt(stmt: Stmt.Expression): void {
        this.resolveExpr(stmt.expression);
    }

    public visitFunctionStmt(stmt: Stmt.Function): void {
        this.declare(stmt.name);
        this.define(stmt.name);

        this.resolveFunction(stmt, EFunctionType.FUNCTION);
    }

    public visitIfStmt(stmt: Stmt.If): void {
        this.resolveStatement(stmt);
        this.resolveStatement(stmt.thenBranch);
        // 不管条件，有就解析
        if (stmt.elseBranch !== null) {
            this.resolveStatement(stmt.elseBranch);
        }
    }

    public visitPrintStmt(stmt: Stmt.Print): void {
        this.resolveExpr(stmt.expression);
    }

    public visitReturnStmt(stmt: Stmt.Return): void {
        if (this.currentFunction === EFunctionType.NONE) {
            Lox.error(stmt.keyword, "Can't return from top-level code.");
        }        
        
        if (stmt.value !== null) {
            if (this.currentFunction === EFunctionType.INITIALIZER) {
                Lox.error(stmt.keyword, "Can't return a value from an initializer.");
            }
            
            this.resolveExpr(stmt.value);
        }
    }

    public visitWhileStmt(stmt: Stmt.While): void {
        this.resolveExpr(stmt.condition);
        this.resolveStatement(stmt.body);
    }

    public visitBinaryExpr(expr: Expr.Binary): void {
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }

    public visitCallExpr(expr: Expr.Call): void {
        this.resolveExpr(expr.callee);

        expr.argumentList.forEach(argument => {
            this.resolveExpr(argument);
        })
    }

    public visitGetExpr(expr: Expr.Get): void {
        this.resolveExpr(expr.object);
    }

    public visitGroupingExpr(expr: Expr.Grouping): void {
        this.resolveExpr(expr.expression);
    }

    public visitLiteralExpr(expr: Expr.Literal): void {
        return;
    }

    public visitLogicalExpr(expr: Expr.Logical): void {
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }

    public visitSetExpr(expr: Expr.Set): void {
        this.resolveExpr(expr.value);
        this.resolveExpr(expr.object);
    }

    public visitSuperExpr(expr: Expr.Super): void {
        if (this.currentClass === EClassType.NONE) {
            Lox.error(expr.keyword, "Can't use 'super' outside of a class.");
        } else if (this.currentClass !== EClassType.SUBCLASS) {
            Lox.error(expr.keyword, "Can't use 'super' in a class with no superclass.");
        }
        
        this.resolveLocal(expr, expr.keyword);
    }

    public visitThisExpr(expr: Expr.This): void {
        if (this.currentClass === EClassType.NONE) {
            Lox.error(expr.keyword, "Cant't use 'this' outside of a class.");
            return;
        }
        
        this.resolveLocal(expr, expr.keyword);
    }

    public visitUnaryExpr(expr: Expr.Unary): void {
        this.resolveExpr(expr.right);
    }

    public visitVarStmt(stmt: Stmt.Var): void {
        this.declare(stmt.name);
        if (stmt.initializer !== null) {
            this.resolveExpr(stmt.initializer);
        }
        this.define(stmt.name);
    }

    public visitAssignExpr(expr: Expr.Assign): void {
        this.resolveExpr(expr.value);
        this.resolveLocal(expr, expr.name);
    }

    public visitVariableExpr(expr: Expr.Variable): void {
        // 如果当前变量存在于当前作用域中，但值是 false，表示已经声明了但还未定义，抛出错误
        if (!this.scopes.length && this.peekScopes()?.get(expr.name.lexeme) === false) {
            Lox.error(expr.name, "Can't read local variable in its own initializer.");
        }

        this.resolveLocal(expr, expr.name);
    }

    resolveStatements(statements: Stmt.Stmt[]) {
        statements.forEach(statement => {
            this.resolveStatement(statement);
        })
    }

    resolveStatement(stmt: Stmt.Stmt) {
        stmt.accept(this);
    }

    resolveExpr(expr: Expr.Expr) {
        expr.accept(this);
    }

    private resolveFunction(func: Stmt.Function, type: EFunctionType) {
        const enclosingFunction: EFunctionType = this.currentFunction;
        this.currentFunction = type;
        
        this.beginScope();
        func.params.forEach((param: Token) => {
            this.declare(param);
            this.define(param);
        })
        this.resolveStatements(func.body);
        this.endScope();
        this.currentFunction = enclosingFunction;
    }

    private beginScope(): void {
        this.scopes.push(new Map<string, boolean>())
    }

    private endScope(): void {
        this.scopes.pop();
    }

    private declare(name: Token): void {
        if (!this.scopes.length) {
            return;
        }

        const scope = this.peekScopes();

        if (scope.get(name.lexeme)) {
            Lox.error(name, "Already a variable with this name in this scope.");
        }

        // 设置为 false，表示该变量还未准备好
        scope.set(name.lexeme, false);
    }

    private define(name: Token) {
        if (!this.scopes.length) {
            return;
        }
        this.peekScopes().set(name.lexeme, true);
    }

    private resolveLocal(expr: Expr.Expr, name: Token) {
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
    private peekScopes() {
        return this.scopes[this.scopes.length - 1];
    }
}