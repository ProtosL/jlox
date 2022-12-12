import { Expr } from './lib/expr';
import { Stmt } from './lib/stmt';
import { Interpreter } from './interpreter';
import { Token } from './token';
import { Lox } from './lox';

export class Resolver implements Expr.Visitor<void>, Stmt.Visitor<void> {
    private readonly interpreter: Interpreter;
    private readonly scopes: Map<string, boolean>[] = [];

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter;
    }

    public visitBlockStmt(stmt: Stmt.Block): void {
        this.beginScope();
        this.resolveStatements(stmt.statements);
        this.endScope();
    }

    public visitFunctionStmt(stmt: Stmt.Function): void {
        this.declare(stmt.name);
        this.define(stmt.name);

        this.resolveFunction(stmt);
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
        if (!this.scopes.length && this.peekScopes().get(expr.name.lexeme) === false) {
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

    private resolveFunction(func: Stmt.Function) {
        this.beginScope();
        func.params.forEach((param: Token) => {
            this.declare(param);
            this.define(param);
        })
        this.resolveStatements(func.body);
        this.endScope();
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