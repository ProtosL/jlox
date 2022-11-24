import { Expr } from "./lib/expr";
import { Token } from "./token";
import { TokenType } from "./token-type";

export class AstPrinter implements Expr.Visitor<string> {

    print(expr: Expr.Expr): string {
        return expr.accept(this);
    }

    public visitBinaryExpr(expr: Expr.Binary): string {
        return this.parenthesize(expr.operator.lexeme,
            expr.left, expr.right);
    }

    public visitGroupingExpr(expr: Expr.Grouping): string {
        return this.parenthesize("group", expr.expression);
    }

    public visitLiteralExpr(expr: Expr.Literal): string {
        if (expr.value == null) return "nil";
        return expr.value.toString();
    }

    public visitUnaryExpr(expr: Expr.Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }

    private parenthesize(name: string, ...exprs: Expr.Expr[]) {
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
        const expression = new Expr.Binary(
            new Expr.Unary(
                new Token(TokenType.MINUS, "-", "{}", 1),
                new Expr.Literal(123)
            ),
            new Token(TokenType.STAR, "*", "{}", 1),
            new Expr.Grouping(
                new Expr.Literal(45.67)
            )
        );

        console.log(new AstPrinter().print(expression));
    }
}

// AstPrinter.run(); // (* (- 123) (group 45.67))