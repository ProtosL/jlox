/**
 * program        → declaration* EOF ;
 * 
 * declaration    → classDecl
 *                | funDecl
 *                | varDecl
 *                | statement ;
 * 
 * classDecl      → "class" IDENTIFIER ( "<" IDENTIFIER )? "{" function* "}" ;
 * 
 * funDecl        → "fun" function ;
 * function       → IDENTIFIER "(" parameters? ")" block ;
 * parameters     → IDENTIFIER ( "," IDENTIFIER )* ;
 * 
 * varDecl        → "var" IDENTIFIER ( "=" expression )? ";" ;
 * 
 * statement      → exprStmt
 *                | forStmt
 *                | ifStmt
 *                | printStmt 
 *                | returnStmt
 *                | whileStmt
 *                | block ;
 * 
 * exprStmt       → expression ";" ;
 * 
 * forStmt        → "for" "(" ( varDecl | exprStmt | ";" )
 *                  expression? ";"
 *                  expression? ")" statement ;
 * 
 * ifStmt         → "if" "(" expression ")" statement ( "else" statement )? ;
 * 
 * printStmt      → "print" expression ";" ;
 * 
 * returnStmt     → "return" expression? ";" ;
 * 
 * whileStmt      → "while" "(" expression ")" statement ;
 * 
 * expression     → assignment ;
 * assignment     → ( call "." )? IDENTIFIER "=" assignment
 *                | logic_or ;
 * logic_or       → logic_and ( "or" logic_and )* ;
 * logic_and      → equality ( "and" equality )* ;
 * equality       → comparison ( ( "!=" | "==" ) comparison )* ;
 * comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
 * term           → factor ( ( "-" | "+" ) factor )* ;
 * factor         → unary ( ( "/" | "*" ) unary )* ;
 * # 一元表达式可以嵌套，形如 !!
 * unary          → ( "!" | "-" ) unary
 *                | call ;
 * call           → primary ( "(" arguments? ")" | "." IDENTIFIER )* ;
 * arguments      → expression ( "," expression )* ;
 * primary        → "true" | "false" | "nil" | "this"
 *                | NUMBER | STRING | IDENTIFIER | "(" expression ")"
 *                | "super" "." IDENTIFIER ;
 */
import { Token } from './token';
import { Expr } from './lib/expr';
import { Stmt } from './lib/stmt';
import { TokenType } from './token-type';
import { Lox } from './lox';
import { Nullable } from './type';

export class Parser {
    static ParseError: ParseError;
    
    private readonly tokens: Token[];
    private current = 0; // 指向等待解析的下一个 token

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): Stmt.Stmt[] {
        const statements: Stmt.Stmt[] = [];
        while(!this.isAtEnd()) {
            statements.push(this.declaration());
        }

        return statements;
    }

    /**
     * expression     → assignment ;
     * assignment     → IDENTIFIER "=" assignment
                      | logic_or ;
     * logic_or       → logic_and ( "or" logic_and )* ;
     * logic_and      → equality ( "and" equality )* ;
     */
    private expression(): Expr.Expr {
        return this.assignment();
    }

    /**
     * declaration    → classDecl
     *                | funDecl
     *                | varDecl
     *                | statement ;
     * 
     * funDecl        → "fun" function ;
     * function       → IDENTIFIER "(" parameters? ")" block ;
     * 
     * parameters     → IDENTIFIER ( "," IDENTIFIER )* ;
     */
    private declaration(): Stmt.Stmt {
        try {
            if (this.match(TokenType.CLASS)) {
                return this.classDeclaration();
            }
            if (this.match(TokenType.FUN)) {
                return this.function("function");
            }
            if (this.match(TokenType.VAR)) {
                return this.varDeclaration();
            }
            return this.statement();
        } catch (error) {
            this.synchronize();
            // @ts-ignore
            return null;
        }
    }

    /**
     * classDecl      → "class" IDENTIFIER "{" function* "}" ;
     */
    private classDeclaration(): Stmt.Stmt {
        const name: Token = this.consume(TokenType.IDENTIFIER, "Expect class name");

        let superclass: Nullable<Expr.Variable> = null;
        if (this.match(TokenType.LESS)) {
            this.consume(TokenType.IDENTIFIER, "Expect superclass name.");
            superclass = new Expr.Variable(this.previous());
        }
        
        this.consume(TokenType.LEFT_BRACE, "Expect '{' before class body.");

        const methods: Stmt.Function[] = [];
        while(!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            methods.push(this.function("method"));
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after class body.");

        return new Stmt.Class(name, superclass, methods);
    }

    /**
     * statement      → exprStmt
     *                | forStmt
     *                | ifStmt
     *                | printStmt
     *                | returnStmt
     *                | whileStmt
     *                | block ;
     * 
     * forStmt        → "for" "(" ( varDecl | exprStmt | ";" )
     *                  expression? ";"
     * .                expression? ")" statement ;
     * ifStmt         → "if" "(" expression ")" statement
     *                ( "else" statement)? ;
     * 
     * returnStmt     → "return" expression? ";" ;
     * 
     * block          → "{" declaration* "}" ;
     */
    private statement(): Stmt.Stmt {
        if (this.match(TokenType.FOR)) {
            return this.forStatement();
        }
        if (this.match(TokenType.IF)) {
            return this.ifStatement();
        }
        if (this.match(TokenType.PRINT)) {
            return this.printStatement();
        }
        if (this.match(TokenType.RETURN)) {
            return this.returnStatement();
        }
        if (this.match(TokenType.WHILE)) {
            return this.whileStatement();
        }
        if (this.match(TokenType.LEFT_BRACE)) {
            return new Stmt.Block(this.block());
        }

        return this.expressionStatement();
    }

    /**
     * for 语法可以通过 while 来实现
     * {
     *   var i = 0;
     *   while (i < 10) {
     *     print i;
     *     i = i + 1;
     *   }
     * }
     * 
     * forStmt        → "for" "(" ( varDecl | exprStmt | ";" )
     *                  expression? ";"
     *                  expression? ")" statement ;
     */
    private forStatement() {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

        let initializer: Nullable<Stmt.Stmt>;
        if (this.match(TokenType.SEMICOLON)) {
            initializer = null;
        } else if (this.match(TokenType.VAR)) {
            initializer = this.varDeclaration();
        } else {
            initializer = this.expressionStatement();
        }

        let condition: Nullable<Expr.Expr> = null;
        if (!this.check(TokenType.SEMICOLON)) {
            condition = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

        let increment: Nullable<Expr.Expr> = null;
        if (!this.check(TokenType.RIGHT_PAREN)) {
            increment = this.expression();
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");
        let body = this.statement();

        if (increment !== null) {
            // 在每次循环体 body 执行后，执行 increment 语句
            body = new Stmt.Block([body, new Stmt.Expression(increment)]);
        }

        if (condition === null) {
            // 无条件时视为 true
            condition = new Expr.Literal(true);
        }
        body = new Stmt.While(condition, body);

        if (initializer !== null) {
            body = new Stmt.Block([initializer, body]);
        }
        
        return body;
    }

    private ifStatement(): Stmt.Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        const condition: Expr.Expr = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

        const thenBranch: Stmt.Stmt = this.statement();
        let elseBranch: Nullable<Stmt.Stmt> = null;
        if (this.match(TokenType.ELSE)) {
            elseBranch = this.statement();
        }

        return new Stmt.If(condition, thenBranch, elseBranch);
    }

    private printStatement() {
        const value: Expr.Expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return new Stmt.Print(value);
    }

    private returnStatement() {
        const keyword: Token = this.previous();
        let value: Nullable<Expr.Expr> = null;
        if (!this.check(TokenType.SEMICOLON)) {
            value = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
        return new Stmt.Return(keyword, value);
    }

    private varDeclaration(): Stmt.Stmt {
        const name: Token = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

        // @ts-ignore
        let initializer: Expr.Expr = null;
        if (this.match(TokenType.EQUAL)) {
            initializer = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return new Stmt.Var(name, initializer);
    }

    private whileStatement() {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after while.");
        const condition = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
        const body = this.statement();
        
        return new Stmt.While(condition, body);
    }

    private expressionStatement() {
        const expr: Expr.Expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
        return new Stmt.Expression(expr);
    }

    /**
     * function       → IDENTIFIER "(" parameters? ")" block ;
     * parameters     → IDENTIFIER ( "," IDENTIFIER )* ;
     */
    private function(kind: string): Stmt.Function {
        const name: Token = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
        this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);
        const parameters: Token[] = [];        
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (parameters.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 parameters.");
                }

                parameters.push(this.consume(TokenType.IDENTIFIER, "Expect parameter name."));
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

        this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
        const body: Stmt.Stmt[] = this.block();
        return new Stmt.Function(name, parameters, body);
    }

    private block(): Stmt.Stmt[] {
        const statements: Stmt.Stmt[] = [];

        while(!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
        return statements;
    }

    /**
     * 赋值
     * assignment     → IDENTIFIER "=" assignment
                      | logic_or ;
     * logic_or       → logic_and ( "or" logic_and )* ;
     * logic_and      → equality ( "and" equality )* ;
     */
    private assignment(): Expr.Expr {
        const expr: Expr.Expr = this.or();

        if (this.match(TokenType.EQUAL)) {
            const equals: Token = this.previous();
            const value: Expr.Expr = this.assignment();

            if (expr instanceof Expr.Variable) {
                const name: Token = expr.name;
                return new Expr.Assign(name, value);
            } else if (expr instanceof Expr.Get) {
                const get: Expr.Get = expr;
                return new Expr.Set(get.object, get.name, value);
            }

            this.error(equals, "Invalid assignment target.");
        }

        return expr;
    }

    /**
     * logic_or       → logic_and ( "or" logic_and )* ;
     */
    private or(): Expr.Expr {
        let expr: Expr.Expr = this.and();

        if (this.match(TokenType.OR)) {
            const operator: Token = this.previous();
            const right: Expr.Expr = this.and();
            expr = new Expr.Logical(expr, operator, right);
        }

        return expr;
    }

    /**
     * logic_and      → equality ( "and" equality )* ;
     */
    private and(): Expr.Expr {
        let expr = this.equality();

        while(this.match(TokenType.AND)) {
            const operator: Token = this.previous();
            const right: Expr.Expr = this.equality();
            expr = new Expr.Logical(expr, operator, right);
        }

        return expr;
    }

    /**
     * equality       → comparison ( ( "!=" | "==" ) comparison )* ;
     */
    private equality(): Expr.Expr {
        let expr: Expr.Expr = this.comparison();

        while(this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator: Token = this.previous();
            const right: Expr.Expr = this.comparison();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    /**
     * comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
     */
    private comparison(): Expr.Expr {
        let expr = this.term();

        while(this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
            const operator: Token = this.previous();
            const right: Expr.Expr = this.term();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }
    
    /**
     * 加法与减法
     */
    private term(): Expr.Expr {
        let expr: Expr.Expr = this.factor();

        while(this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator: Token = this.previous();
            const right: Expr.Expr = this.factor();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    /**
     * 乘法与除法
     */
    private factor(): Expr.Expr {
        let expr = this.unary();

        while(this.match(TokenType.SLASH, TokenType.STAR)) {
            const operator: Token = this.previous();
            const right: Expr.Expr = this.unary();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    /**
     * unary          → ( "!" | "-" ) unary | call ;
     * call           | primary ( "(" arguments? ")" )* ;
     */
    private unary(): Expr.Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator: Token = this.previous();
            const right = this.unary();
            return new Expr.Unary(operator, right);
        }

        return this.call();
    }

    private finishCall(callee: Expr.Expr): Expr.Expr {
        const argumentList: Expr.Expr[] = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (argumentList.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 argumetns.");
                }
                argumentList.push(this.expression());
            } while (this.match(TokenType.COMMA));
        }

        const paren = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

        return new Expr.Call(callee, paren, argumentList);
    }

    private call(): Expr.Expr {
        let expr: Expr.Expr = this.primary();

        while(true) {
            if (this.match(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            } else if(this.match(TokenType.DOT)) {
                const name: Token = this.consume(TokenType.IDENTIFIER, "Expect property name after '.'.");
                expr = new Expr.Get(expr, name);
            } else {
                break;
            }
        }

        return expr;
    }

    /**
     * primary        → "true" | "false" | "nil" | "this"
     *                | NUMBER | STRING | IDENTIFIER | "(" expression ")"
     *                | "super" "." IDENTIFIER ;
     */
    private primary(): Expr.Expr {
        if (this.match(TokenType.FALSE)) {
            return new Expr.Literal(false);
        }
        if (this.match(TokenType.TRUE)) {
            return new Expr.Literal(true);
        }
        if (this.match(TokenType.NIL)) {
            return new Expr.Literal(null);
        }

        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return new Expr.Literal(this.previous().literal);
        }

        if (this.match(TokenType.SUPER)) {
            const keyword: Token = this.previous();
            this.consume(TokenType.DOT, "Expect '.' after 'super'.");
            const method: Token = this.consume(TokenType.IDENTIFIER, "Expect superclass method name.");
            return new Expr.Super(keyword, method);
        }

        if (this.match(TokenType.THIS)) {
            return new Expr.This(this.previous());
        }

        if (this.match(TokenType.IDENTIFIER)) {
            return new Expr.Variable(this.previous());
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            const expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, `Expect ')' after expression.`)
            return new Expr.Grouping(expr);
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
     * 检查 token 是否为指定的 TokenType，是则返回 token 并向前推进一位，否则报告错误
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
