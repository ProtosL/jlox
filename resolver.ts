import { Expr } from './lib/expr';
import { Stmt } from './lib/stmt';
import { Interpreter } from './interpreter';
import { Token } from './token';

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

    public visitVarStmt(stmt: Stmt.Var): void {
        this.declare(stmt.name);
        if (stmt.initializer !== null) {
            this.resolveExpr(stmt.initializer);
        }
        this.define(stmt.name);
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
        /**
         * 设置为 false，表示该变量还未准备好
         */
        scope.set(name.lexeme, false);
    }

    private define(name: Token) {
        if (!this.scopes.length) {
            return;
        }
        this.peekScopes().set(name.lexeme, true);
    }

    /**
     * 获取 scopes 中最后一个元素
     */
    private peekScopes() {
        return this.scopes[this.scopes.length - 1];
    }
}