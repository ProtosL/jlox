import { Binary, Expr, Grouping, Literal, Unary, Visitor } from "./lib/expr";
import { RuntimeError } from "./runtime-error";
import { Token } from "./token";
import { TokenType } from "./token-type";
import { Lox } from './lox';
import { Nullable } from "./type.d";

export class Interpreter implements Visitor<Nullable<Object>> {
    public visitLiteralExpr(expr: Literal): Nullable<Object> {
        return expr.value;
    }

    public visitGroupingExpr(expr: Grouping): Nullable<Object> {
        return this.evaluate(expr.expression);
    }

    public visitUnaryExpr(expr: Unary): Nullable<Object> {
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

    private checkNumberOperand(operator: Token, operand: Nullable<Object>) {
        if (typeof operand === 'number') {
            return ;
        }
        throw new RuntimeError(operator, 'Operand must be a number');
    }

    public visitBinaryExpr(expr: Binary): Nullable<Object> {
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

    private isTruthy(object: Nullable<Object>): boolean {
        if (object === null) {
            return false;
        }

        if (typeof object === 'boolean') {
            return Boolean(object);
        }
        return true;
    }

    // 获取值
    private evaluate(expr: Expr): Nullable<Object> {
        return expr.accept(this);
    }

    interpret(expression: Expr) {
        try {
            const value = this.evaluate(expression);
            console.log(this.stringify(value))
        } catch (error) {
            Lox.runtimeError(error);
        }
    }

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