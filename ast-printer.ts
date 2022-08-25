import { Expr, Visitor, Grouping, Literal, Unary, Binary } from "./lib/expr";
import { Token } from "./token";
import { TokenType } from "./token-type";

export class AstPrinter implements Visitor<string> {

    print(expr: Expr): string {
        return expr.accept(this);
    }

    public visitBinaryExpr(expr: Binary): string {
        return this.parenthesize(expr.operator.lexeme,
            expr.left, expr.right);
    }

    public visitGroupingExpr(expr: Grouping): string {
        return this.parenthesize("group", expr.expression);
    }

    public visitLiteralExpr(expr: Literal): string {
        if (expr.value == null) return "nil";
        return expr.value.toString();
    }

    public visitUnaryExpr(expr: Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }

    private parenthesize(name: string, ...exprs: Expr[]) {
        let str = '';
        str += `(${name}`;

        exprs.forEach(expr => {
            str += ' ';
            str += expr.accept(this);
        })

        str += `)`;

        return str;
    }

    // 测试
    public static run() {
        const expression = new Binary(
            new Unary(
                new Token(TokenType.MINUS, "-", "{}", 1),
                new Literal(123)
            ),
            new Token(TokenType.STAR, "*", "{}", 1),
            new Grouping(
                new Literal(45.67)
            )
        );

        console.log(new AstPrinter().print(expression));
    }
}

AstPrinter.run(); // (* (- 123) (group 45.67))