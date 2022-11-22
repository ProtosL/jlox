import { Token } from './token';
import { Expr, Binary, Unary, Literal, Grouping } from './lib/expr';
import { TokenType } from './token-type';
import { Lox } from './lox';

export class Parser {
    static ParseError: ParseError;
    
    private readonly tokens: Token[];
    private current = 0; // 指向等待解析的下一个 token

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): Expr| null {
        try {
            return this.expression();
        } catch (e) {
            return null;
        }
    }

    private expression(): Expr {
        return this.equality();
    }

    /**
     * equality       → comparison ( ( "!=" | "==" ) comparison )* ;
     */
    private equality(): Expr {
        let expr: Expr = this.comparison();

        while(this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator: Token = this.previous();
            const right: Expr = this.comparison();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    /**
     * comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
     */
    private comparison(): Expr {
        let expr = this.term();

        while(this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
            const operator: Token = this.previous();
            const right: Expr = this.term();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }
    
    /**
     * 加法与减法
     */
    private term(): Expr {
        let expr: Expr = this.factor();

        while(this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator: Token = this.previous();
            const right: Expr = this.factor();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    /**
     * 乘法与除法
     */
    private factor(): Expr {
        let expr = this.unary();

        while(this.match(TokenType.SLASH, TokenType.STAR)) {
            const operator: Token = this.previous();
            const right: Expr = this.unary();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    /**
     * unary          → ( "!" | "-" ) unary
     *                | primary ;
     */
    private unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator: Token = this.previous();
            const right = this.unary();
            return new Unary(operator, right);
        }

        return this.primary();
    }

    /**
     * primary        → NUMBER | STRING | "true" | "false" | "nil"
     *                | "(" expression ")" ;
     */
    private primary(): Expr {
        if (this.match(TokenType.FALSE)) {
            return new Literal(false);
        }
        if (this.match(TokenType.TRUE)) {
            return new Literal(true);
        }
        if (this.match(TokenType.NIL)) {
            return new Literal(null);
        }

        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return new Literal(this.previous().literal);
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            const expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, `Expect ')' after expression.`)
            return new Grouping(expr);
        }

        throw this.error(this.peek(), 'Expect expression.');
    }
    
    /**
     * 判断当前 token 是否为指定的 TokenType，如果是，则向前推进一位并返回 true，否则仅返回 false
     */
    private match(...types: TokenType[]): boolean {
        return types.some(type => {
            if (this.check(type)) {
                this.advance();
                return true;
            }
            return false;
        })
    }

    /**
     * 检查 token 是否为指定的 TokenType，是则返回 token，否则报告错误
     */
    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) {
            return this.advance();
        }

        throw this.error(this.peek(), message);
    }

    /**
     * 判断当前 token 是否为指定的 TokenType
     */
    private check(type: TokenType): boolean {
        if (this.isAtEnd()) {
            return false;
        }
        return this.peek().type === type;
    }

    /**
     * 获取当前 token 并向前推进一位
     */
    private advance(): Token {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }

    /**
     * 判断是否为最后一位
     */
    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    /**
     * 获取当前 token
     */
    private peek(): Token {
        return this.tokens[this.current];
    }

    /**
     * 获取前一个 token
     */
    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private error(token: Token, message: string): ParseError {
        Lox.error(token, message);
        return new ParseError();
    }

    // 在第 8 章用到
    private synchronize() {
        this.advance();

        while(!this.isAtEnd()) {
            if (this.previous().type === TokenType.SEMICOLON) {
                return;
            }

            switch(this.peek().type) {
                case TokenType.CLASS:
                case TokenType.FUN:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.PRINT:
                case TokenType.RETURN:
                    return;
            }

            this.advance();
        }
    }
}

class ParseError {

}

Parser.ParseError = ParseError;
