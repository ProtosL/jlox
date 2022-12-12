import { Expr } from "./lib/expr";
import { RuntimeError } from "./runtime-error";
import { Token } from "./token";
import { TokenType } from "./token-type";
import { Lox } from './lox';
import { Nullable } from "./type.d";
import { Stmt } from "./lib/stmt";
import { Environment } from "./environment";
import { instanceOfLoxCallable, LoxCallable } from './lox-callable';
import { LoxFunction } from './lox-function';
import { Return } from './return';

export class Interpreter implements Expr.Visitor<Nullable<Object>>, Stmt.Visitor<void> {
    /**
     * 最外层环境
     */
    readonly globals: Environment = new Environment();
    private environment = this.globals;
    private readonly locals: Map<Expr.Expr, number> = new Map();

    constructor() {
        /**
         * 定义全局函数 clock
         */
        this.globals.define('clock', {
            arity: () => {
                return 0;
            },
            call: (Interpreter: Interpreter, argumentList: Nullable<Object>[]) => {
                return +new Date() / 1000;
            },
            toString: () => {
                return "<native fn>";
            }
        } as LoxCallable);
    }
    
    public visitLiteralExpr(expr: Expr.Literal): Nullable<Object> {
        return expr.value;
    }

    public visitLogicalExpr(expr: Expr.Logical): Nullable<Object> {
        const left = this.evaluate(expr.left);

        if (expr.operator.type === TokenType.OR) {
            // or 语句左侧为真时直接返回
            if (this.isTruthy(left)) {
                return left;
            }
        } else if (expr.operator.type === TokenType.AND) {
            // and 语句左侧为假时直接返回
            if (!this.isTruthy(left)) {
                return left;
            }
        }

        return this.evaluate(expr.right);
    }

    public visitGroupingExpr(expr: Expr.Grouping): Nullable<Object> {
        return this.evaluate(expr.expression);
    }

    public visitUnaryExpr(expr: Expr.Unary): Nullable<Object> {
        const right: Nullable<Object> = this.evaluate(expr.right);

        switch(expr.operator.type) {
            case TokenType.BANG:
                // 感叹号就取反
                return !this.isTruthy(right);
            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return -Number(right)
        }

        // Unreachable
        return null;
    }

    public visitVariableExpr(expr: Expr.Variable): Nullable<Object> {
        return this.lookUpVariable(expr.name, expr);
    }

    private lookUpVariable(name: Token, expr: Expr.Expr): Nullable<Object> {
        const distance = this.locals.get(expr);
        if (distance !== undefined) {
            return this.environment.getAt(distance, name.lexeme);
        } else {
            return this.globals.get(name);
        }
    }

    private checkNumberOperand(operator: Token, operand: Nullable<Object>) {
        if (typeof operand === 'number') {
            return ;
        }
        throw new RuntimeError(operator, 'Operand must be a number');
    }

    public visitBinaryExpr(expr: Expr.Binary): Nullable<Object> {
        const left: Nullable<Object> = this.evaluate(expr.left);
        const right: Nullable<Object> = this.evaluate(expr.right);

        switch(expr.operator.type) {
            case TokenType.MINUS:
                return Number(left) - Number(right);
            case TokenType.PLUS:
                if (typeof left === 'number' && typeof right === 'number') {
                    return Number(left) + Number(right);
                }

                if (typeof left === 'string' && typeof right === 'string') {
                    return String(left) + String(right);
                }

                if (typeof left === 'string' && typeof right === 'number') {
                    return String(left) + String(right);
                }
                throw new RuntimeError(expr.operator, 'Operands must be two numbers or two strings.');
            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                if (right === 0) {
                    throw new RuntimeError(expr.operator, 'Right operand must not be zero.');
                }
                return Number(left) / Number(right);
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) * Number(right);
            case TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) > Number(right);
            case TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) >= Number(right);
            case TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) < Number(right);
            case TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) <= Number(right);
            case TokenType.BANG_EQUAL:
                return !this.isEqual(left, right);
            case TokenType.EQUAL_EQUAL:
                return this.isEqual(left, right)
        }

        // Unreachable
        return null;
    }

    public visitCallExpr(expr: Expr.Call): Nullable<Object> {
        const callee = this.evaluate(expr.callee);
        
        const argumentList: Nullable<Object>[] = [];
        expr.argumentList.forEach(argument => {
            argumentList.push(this.evaluate(argument));
        });

        if (!(instanceOfLoxCallable(callee))) {
            throw new RuntimeError(expr.paren, "Can only call functions and classes.");
        }
        
        const func = callee as LoxCallable;
        // 确保参数数量一致
        if (argumentList.length !== func.arity()) {
            throw new RuntimeError(expr.paren, `Expected ${func.arity()} arguments but got ${argumentList.length}.`);
        }        
        
        return func.call(this, argumentList);
    }

    public visitExpressionStmt(stmt: Stmt.Expression): void {
        this.evaluate(stmt.expression);
        return ;
    }

    public visitFunctionStmt(stmt: Stmt.Function): void {
        const fun: LoxFunction = new LoxFunction(stmt, this.environment);
        this.environment.define(stmt.name.lexeme, fun);
    }

    public visitIfStmt(stmt: Stmt.If): void {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        } else {
            this.execute(stmt.elseBranch);
        }
        return ;
    }

    public visitPrintStmt(stmt: Stmt.Print): void {
        const value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
        return ;
    }

    public visitReturnStmt(stmt: Stmt.Return): void {
        let value: Nullable<Object> = null;
        if (stmt.value !== null) {
            value = this.evaluate(stmt.value);
        }

        throw new Return(value);
    }

    public visitVarStmt(stmt: Stmt.Var): void {
        let value: Nullable<Object> = null;
        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer);
        }

        this.environment.define(stmt.name.lexeme, value);
    }

    public visitWhileStmt(stmt: Stmt.While): void {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
    }

    public visitAssignExpr(expr: Expr.Assign): Nullable<Object> {
        const value = this.evaluate(expr.value);

        const distance = this.locals.get(expr);
        if (distance !== undefined) {
            this.environment.assignAt(distance, expr.name, value);
        } else {
            this.globals.assign(expr.name, value);
        }
        
        return value;
    }

    private checkNumberOperands(operator: Token, left: Nullable<Object>, right: Nullable<Object>) {
        if (typeof left === 'number' && typeof right === 'number') {
            return ;
        }

        throw new RuntimeError(operator, 'Operands must be numbers');
    }

    private isEqual(a: Nullable<Object>, b: Nullable<Object>) {
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
    private isTruthy(object: Nullable<Object>): boolean {
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
    private evaluate(expr: Expr.Expr): Nullable<Object> {
        return expr.accept(this);
    }

    private execute(stmt: Nullable<Stmt.Stmt>) {
        stmt?.accept(this);
    }

    resolve(expr: Expr.Expr, depth: number) {
        this.locals.set(expr, depth);
    }

    executeBlock(statements: Stmt.Stmt[], environment: Environment) {
        const previous: Environment = this.environment;
        try {
            this.environment = environment;
            statements.forEach(statement => {
                this.execute(statement);
            })
        } finally {
            this.environment = previous;
        }
    }

    public visitBlockStmt(stmt: Stmt.Block): void {
        this.executeBlock(stmt.statements, new Environment(this.environment));
    }

    interpret(statements: Stmt.Stmt[]) {
        try {
            statements.forEach(statement => {
                this.execute(statement);
            })
        } catch (error) {
            Lox.runtimeError(error);
        }
    }

    /**
     * 转换为字符串
     */
    private stringify(object: Nullable<Object>): string {
        if (object === null) {
            return 'nil'
        }
        if (typeof object === 'number') {
            let text: string = object.toString();
            return text;
        }
        return object.toString();
    }
}