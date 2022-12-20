"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const expr_1 = require("./lib/expr");
const stmt_1 = require("./lib/stmt");
const token_type_1 = require("./token-type");
const lox_1 = require("./lox");
class Parser {
    constructor(tokens) {
        this.current = 0; // 指向等待解析的下一个 token
        this.tokens = tokens;
    }
    parse() {
        const statements = [];
        while (!this.isAtEnd()) {
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
    expression() {
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
    declaration() {
        try {
            if (this.match(token_type_1.TokenType.CLASS)) {
                return this.classDeclaration();
            }
            if (this.match(token_type_1.TokenType.FUN)) {
                return this.function("function");
            }
            if (this.match(token_type_1.TokenType.VAR)) {
                return this.varDeclaration();
            }
            return this.statement();
        }
        catch (error) {
            this.synchronize();
            // @ts-ignore
            return null;
        }
    }
    /**
     * classDecl      → "class" IDENTIFIER "{" function* "}" ;
     */
    classDeclaration() {
        const name = this.consume(token_type_1.TokenType.IDENTIFIER, "Expect class name");
        let superclass = null;
        if (this.match(token_type_1.TokenType.LESS)) {
            this.consume(token_type_1.TokenType.IDENTIFIER, "Expect superclass name.");
            superclass = new expr_1.Expr.Variable(this.previous());
        }
        this.consume(token_type_1.TokenType.LEFT_BRACE, "Expect '{' before class body.");
        const methods = [];
        while (!this.check(token_type_1.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            methods.push(this.function("method"));
        }
        this.consume(token_type_1.TokenType.RIGHT_BRACE, "Expect '}' after class body.");
        return new stmt_1.Stmt.Class(name, superclass, methods);
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
    statement() {
        if (this.match(token_type_1.TokenType.FOR)) {
            return this.forStatement();
        }
        if (this.match(token_type_1.TokenType.IF)) {
            return this.ifStatement();
        }
        if (this.match(token_type_1.TokenType.PRINT)) {
            return this.printStatement();
        }
        if (this.match(token_type_1.TokenType.RETURN)) {
            return this.returnStatement();
        }
        if (this.match(token_type_1.TokenType.WHILE)) {
            return this.whileStatement();
        }
        if (this.match(token_type_1.TokenType.LEFT_BRACE)) {
            return new stmt_1.Stmt.Block(this.block());
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
    forStatement() {
        this.consume(token_type_1.TokenType.LEFT_PAREN, "Expect '(' after 'for'.");
        let initializer;
        if (this.match(token_type_1.TokenType.SEMICOLON)) {
            initializer = null;
        }
        else if (this.match(token_type_1.TokenType.VAR)) {
            initializer = this.varDeclaration();
        }
        else {
            initializer = this.expressionStatement();
        }
        let condition = null;
        if (!this.check(token_type_1.TokenType.SEMICOLON)) {
            condition = this.expression();
        }
        this.consume(token_type_1.TokenType.SEMICOLON, "Expect ';' after loop condition.");
        let increment = null;
        if (!this.check(token_type_1.TokenType.RIGHT_PAREN)) {
            increment = this.expression();
        }
        this.consume(token_type_1.TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");
        let body = this.statement();
        if (increment !== null) {
            // 在每次循环体 body 执行后，执行 increment 语句
            body = new stmt_1.Stmt.Block([body, new stmt_1.Stmt.Expression(increment)]);
        }
        if (condition === null) {
            // 无条件时视为 true
            condition = new expr_1.Expr.Literal(true);
        }
        body = new stmt_1.Stmt.While(condition, body);
        if (initializer !== null) {
            body = new stmt_1.Stmt.Block([initializer, body]);
        }
        return body;
    }
    ifStatement() {
        this.consume(token_type_1.TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume(token_type_1.TokenType.RIGHT_PAREN, "Expect ')' after if condition.");
        const thenBranch = this.statement();
        let elseBranch = null;
        if (this.match(token_type_1.TokenType.ELSE)) {
            elseBranch = this.statement();
        }
        return new stmt_1.Stmt.If(condition, thenBranch, elseBranch);
    }
    printStatement() {
        const value = this.expression();
        this.consume(token_type_1.TokenType.SEMICOLON, "Expect ';' after value.");
        return new stmt_1.Stmt.Print(value);
    }
    returnStatement() {
        const keyword = this.previous();
        let value = null;
        if (!this.check(token_type_1.TokenType.SEMICOLON)) {
            value = this.expression();
        }
        this.consume(token_type_1.TokenType.SEMICOLON, "Expect ';' after return value.");
        return new stmt_1.Stmt.Return(keyword, value);
    }
    varDeclaration() {
        const name = this.consume(token_type_1.TokenType.IDENTIFIER, "Expect variable name.");
        // @ts-ignore
        let initializer = null;
        if (this.match(token_type_1.TokenType.EQUAL)) {
            initializer = this.expression();
        }
        this.consume(token_type_1.TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return new stmt_1.Stmt.Var(name, initializer);
    }
    whileStatement() {
        this.consume(token_type_1.TokenType.LEFT_PAREN, "Expect '(' after while.");
        const condition = this.expression();
        this.consume(token_type_1.TokenType.RIGHT_PAREN, "Expect ')' after condition.");
        const body = this.statement();
        return new stmt_1.Stmt.While(condition, body);
    }
    expressionStatement() {
        const expr = this.expression();
        this.consume(token_type_1.TokenType.SEMICOLON, "Expect ';' after expression.");
        return new stmt_1.Stmt.Expression(expr);
    }
    /**
     * function       → IDENTIFIER "(" parameters? ")" block ;
     * parameters     → IDENTIFIER ( "," IDENTIFIER )* ;
     */
    function(kind) {
        const name = this.consume(token_type_1.TokenType.IDENTIFIER, `Expect ${kind} name.`);
        this.consume(token_type_1.TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);
        const parameters = [];
        if (!this.check(token_type_1.TokenType.RIGHT_PAREN)) {
            do {
                if (parameters.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 parameters.");
                }
                parameters.push(this.consume(token_type_1.TokenType.IDENTIFIER, "Expect parameter name."));
            } while (this.match(token_type_1.TokenType.COMMA));
        }
        this.consume(token_type_1.TokenType.RIGHT_PAREN, "Expect ')' after parameters.");
        this.consume(token_type_1.TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
        const body = this.block();
        return new stmt_1.Stmt.Function(name, parameters, body);
    }
    block() {
        const statements = [];
        while (!this.check(token_type_1.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(token_type_1.TokenType.RIGHT_BRACE, "Expect '}' after block.");
        return statements;
    }
    /**
     * 赋值
     * assignment     → IDENTIFIER "=" assignment
                      | logic_or ;
     * logic_or       → logic_and ( "or" logic_and )* ;
     * logic_and      → equality ( "and" equality )* ;
     */
    assignment() {
        const expr = this.or();
        if (this.match(token_type_1.TokenType.EQUAL)) {
            const equals = this.previous();
            const value = this.assignment();
            if (expr instanceof expr_1.Expr.Variable) {
                const name = expr.name;
                return new expr_1.Expr.Assign(name, value);
            }
            else if (expr instanceof expr_1.Expr.Get) {
                const get = expr;
                return new expr_1.Expr.Set(get.object, get.name, value);
            }
            this.error(equals, "Invalid assignment target.");
        }
        return expr;
    }
    /**
     * logic_or       → logic_and ( "or" logic_and )* ;
     */
    or() {
        let expr = this.and();
        if (this.match(token_type_1.TokenType.OR)) {
            const operator = this.previous();
            const right = this.and();
            expr = new expr_1.Expr.Logical(expr, operator, right);
        }
        return expr;
    }
    /**
     * logic_and      → equality ( "and" equality )* ;
     */
    and() {
        let expr = this.equality();
        while (this.match(token_type_1.TokenType.AND)) {
            const operator = this.previous();
            const right = this.equality();
            expr = new expr_1.Expr.Logical(expr, operator, right);
        }
        return expr;
    }
    /**
     * equality       → comparison ( ( "!=" | "==" ) comparison )* ;
     */
    equality() {
        let expr = this.comparison();
        while (this.match(token_type_1.TokenType.BANG_EQUAL, token_type_1.TokenType.EQUAL_EQUAL)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = new expr_1.Expr.Binary(expr, operator, right);
        }
        return expr;
    }
    /**
     * comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
     */
    comparison() {
        let expr = this.term();
        while (this.match(token_type_1.TokenType.GREATER, token_type_1.TokenType.GREATER_EQUAL, token_type_1.TokenType.LESS, token_type_1.TokenType.LESS_EQUAL)) {
            const operator = this.previous();
            const right = this.term();
            expr = new expr_1.Expr.Binary(expr, operator, right);
        }
        return expr;
    }
    /**
     * 加法与减法
     */
    term() {
        let expr = this.factor();
        while (this.match(token_type_1.TokenType.MINUS, token_type_1.TokenType.PLUS)) {
            const operator = this.previous();
            const right = this.factor();
            expr = new expr_1.Expr.Binary(expr, operator, right);
        }
        return expr;
    }
    /**
     * 乘法与除法
     */
    factor() {
        let expr = this.unary();
        while (this.match(token_type_1.TokenType.SLASH, token_type_1.TokenType.STAR)) {
            const operator = this.previous();
            const right = this.unary();
            expr = new expr_1.Expr.Binary(expr, operator, right);
        }
        return expr;
    }
    /**
     * unary          → ( "!" | "-" ) unary | call ;
     * call           | primary ( "(" arguments? ")" )* ;
     */
    unary() {
        if (this.match(token_type_1.TokenType.BANG, token_type_1.TokenType.MINUS)) {
            const operator = this.previous();
            const right = this.unary();
            return new expr_1.Expr.Unary(operator, right);
        }
        return this.call();
    }
    finishCall(callee) {
        const argumentList = [];
        if (!this.check(token_type_1.TokenType.RIGHT_PAREN)) {
            do {
                if (argumentList.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 argumetns.");
                }
                argumentList.push(this.expression());
            } while (this.match(token_type_1.TokenType.COMMA));
        }
        const paren = this.consume(token_type_1.TokenType.RIGHT_PAREN, "Expect ')' after arguments.");
        return new expr_1.Expr.Call(callee, paren, argumentList);
    }
    call() {
        let expr = this.primary();
        while (true) {
            if (this.match(token_type_1.TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            }
            else if (this.match(token_type_1.TokenType.DOT)) {
                const name = this.consume(token_type_1.TokenType.IDENTIFIER, "Expect property name after '.'.");
                expr = new expr_1.Expr.Get(expr, name);
            }
            else {
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
    primary() {
        if (this.match(token_type_1.TokenType.FALSE)) {
            return new expr_1.Expr.Literal(false);
        }
        if (this.match(token_type_1.TokenType.TRUE)) {
            return new expr_1.Expr.Literal(true);
        }
        if (this.match(token_type_1.TokenType.NIL)) {
            return new expr_1.Expr.Literal(null);
        }
        if (this.match(token_type_1.TokenType.NUMBER, token_type_1.TokenType.STRING)) {
            return new expr_1.Expr.Literal(this.previous().literal);
        }
        if (this.match(token_type_1.TokenType.SUPER)) {
            const keyword = this.previous();
            this.consume(token_type_1.TokenType.DOT, "Expect '.' after 'super'.");
            const method = this.consume(token_type_1.TokenType.IDENTIFIER, "Expect superclass method name.");
            return new expr_1.Expr.Super(keyword, method);
        }
        if (this.match(token_type_1.TokenType.THIS)) {
            return new expr_1.Expr.This(this.previous());
        }
        if (this.match(token_type_1.TokenType.IDENTIFIER)) {
            return new expr_1.Expr.Variable(this.previous());
        }
        if (this.match(token_type_1.TokenType.LEFT_PAREN)) {
            const expr = this.expression();
            this.consume(token_type_1.TokenType.RIGHT_PAREN, `Expect ')' after expression.`);
            return new expr_1.Expr.Grouping(expr);
        }
        throw this.error(this.peek(), 'Expect expression.');
    }
    /**
     * 判断当前 token 是否为指定的 TokenType，如果是，则向前推进一位并返回 true，否则仅返回 false
     */
    match(...types) {
        return types.some(type => {
            if (this.check(type)) {
                this.advance();
                return true;
            }
            return false;
        });
    }
    /**
     * 检查 token 是否为指定的 TokenType，是则返回 token 并向前推进一位，否则报告错误
     */
    consume(type, message) {
        if (this.check(type)) {
            return this.advance();
        }
        throw this.error(this.peek(), message);
    }
    /**
     * 判断当前 token 是否为指定的 TokenType
     */
    check(type) {
        if (this.isAtEnd()) {
            return false;
        }
        return this.peek().type === type;
    }
    /**
     * 获取当前 token 并向前推进一位
     */
    advance() {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }
    /**
     * 判断是否为最后一位
     */
    isAtEnd() {
        return this.peek().type === token_type_1.TokenType.EOF;
    }
    /**
     * 获取当前 token
     */
    peek() {
        return this.tokens[this.current];
    }
    /**
     * 获取前一个 token
     */
    previous() {
        return this.tokens[this.current - 1];
    }
    error(token, message) {
        lox_1.Lox.error(token, message);
        return new ParseError();
    }
    // 在第 8 章用到
    synchronize() {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().type === token_type_1.TokenType.SEMICOLON) {
                return;
            }
            switch (this.peek().type) {
                case token_type_1.TokenType.CLASS:
                case token_type_1.TokenType.FUN:
                case token_type_1.TokenType.VAR:
                case token_type_1.TokenType.FOR:
                case token_type_1.TokenType.IF:
                case token_type_1.TokenType.WHILE:
                case token_type_1.TokenType.PRINT:
                case token_type_1.TokenType.RETURN:
                    return;
            }
            this.advance();
        }
    }
}
exports.Parser = Parser;
class ParseError {
}
Parser.ParseError = ParseError;
