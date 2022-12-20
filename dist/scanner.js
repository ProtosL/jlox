"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scanner = void 0;
const token_1 = require("./token");
const token_type_1 = require("./token-type");
const lox_1 = require("./lox");
class Scanner {
    constructor(source) {
        this.tokens = []; // 要生成的标记列表
        // 以下几个字段用于跟踪 scanner 在源代码中的位置
        this.start = 0; // 指向正在扫描的词位的第一个字符
        this.current = 0;
        this.line = 1;
        this.source = source;
    }
    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        // 扫描完再末尾加一个 EOF 标记
        this.tokens.push(new token_1.Token(token_type_1.TokenType.EOF, '', null, this.line));
        return this.tokens;
    }
    scanToken() {
        // current 指向 c 的下一个字符
        const c = this.advance();
        switch (c) {
            case '(':
                this.addToken(token_type_1.TokenType.LEFT_PAREN);
                break;
            case ')':
                this.addToken(token_type_1.TokenType.RIGHT_PAREN);
                break;
            case '{':
                this.addToken(token_type_1.TokenType.LEFT_BRACE);
                break;
            case '}':
                this.addToken(token_type_1.TokenType.RIGHT_BRACE);
                break;
            case ',':
                this.addToken(token_type_1.TokenType.COMMA);
                break;
            case '.':
                this.addToken(token_type_1.TokenType.DOT);
                break;
            case '-':
                this.addToken(token_type_1.TokenType.MINUS);
                break;
            case '+':
                this.addToken(token_type_1.TokenType.PLUS);
                break;
            case ';':
                this.addToken(token_type_1.TokenType.SEMICOLON);
                break;
            case '*':
                this.addToken(token_type_1.TokenType.STAR);
                break;
            // ! 后面可能跟着 = ，即 != ，这种时候要作为一个整体
            case '!':
                this.addToken(this.match('=') ? token_type_1.TokenType.BANG_EQUAL : token_type_1.TokenType.BANG);
                break;
            case '=':
                this.addToken(this.match('=') ? token_type_1.TokenType.EQUAL_EQUAL : token_type_1.TokenType.EQUAL);
                break;
            case '<':
                this.addToken(this.match('=') ? token_type_1.TokenType.LESS_EQUAL : token_type_1.TokenType.LESS);
                break;
            case '>':
                this.addToken(this.match('=') ? token_type_1.TokenType.GREATER_EQUAL : token_type_1.TokenType.GREATER);
                break;
            case '/':
                if (this.match('/')) {
                    while (this.peek() !== '\n' && !this.isAtEnd()) {
                        this.advance();
                    }
                }
                else {
                    this.addToken(token_type_1.TokenType.SLASH);
                }
                break;
            // 跳过空白字符
            case ' ':
            case '\r':
            case '\t':
                break;
            // 换行时行号加一
            case '\n':
                this.line++;
                break;
            case '"':
                this.string();
                break;
            default:
                if (this.isDigit(c)) {
                    this.number();
                }
                else if (this.isAlpha(c)) { // 假设只要是字母或下划线开头的都是关键字
                    this.identifier();
                }
                else {
                    // 不中断扫描，该方法已经设置了 hasError 为 true，不会去执行代码
                    lox_1.Lox.error(this.line, 'Unexpected character.');
                }
                break;
        }
    }
    identifier() {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }
        const text = this.source.substring(this.start, this.current);
        let type = Scanner.keywords[text];
        if (!type) {
            type = token_type_1.TokenType.IDENTIFIER;
        }
        this.addToken(type);
    }
    number() {
        while (this.isDigit(this.peek())) {
            this.advance();
        }
        // 处理小数
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            // 处理 '.'
            this.advance();
            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }
        this.addToken(token_type_1.TokenType.NUMBER, Number(this.source.substring(this.start, this.current)));
    }
    string() {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() == '\n') {
                this.line++;
            }
            this.advance();
        }
        if (this.isAtEnd()) {
            lox_1.Lox.error(this.line, 'Unterminated string.');
            return;
        }
        this.advance();
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(token_type_1.TokenType.STRING, value);
    }
    /**
     * 判断当前字符是不是所期望的，如果是则向前推进一位
     */
    match(expected) {
        if (this.isAtEnd()) {
            return false;
        }
        if (this.source.charAt(this.current) != expected) {
            return false;
        }
        this.current++;
        return true;
    }
    /**
     * 获取当前字符但不向前推进
     */
    peek() {
        if (this.isAtEnd()) {
            // return '\0';
            return '';
        }
        return this.source.charAt(this.current);
    }
    /**
     * 获取下一个字符但不向前推进
     */
    peekNext() {
        if (this.current + 1 >= this.source.length) {
            return '';
        }
        return this.source.charAt(this.current + 1);
    }
    /**
     * 判断是否为字符或下划线
     */
    isAlpha(c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
    }
    /**
     * 判断是否为字符、数字或下划线
     */
    isAlphaNumeric(c) {
        return this.isAlpha(c) || this.isDigit(c);
    }
    /**
     * 判断是否为数字
     */
    isDigit(c) {
        return c >= '0' && c <= '9';
    }
    /**
     * 用于判断是否遍历完所有字符
     */
    isAtEnd() {
        return this.current >= this.source.length;
    }
    /**
     * 获取当前字符并向前推进一个字符
     */
    advance() {
        return this.source.charAt(this.current++);
    }
    /**
     * 获取当前词位的文本并创建一个标记
     */
    addToken(type, literal) {
        if (literal === null || literal !== undefined) {
            const text = this.source.substring(this.start, this.current);
            this.tokens.push(new token_1.Token(type, text, literal, this.line));
        }
        else {
            this.addToken(type, null);
        }
    }
}
exports.Scanner = Scanner;
Scanner.keywords = {
    "and": token_type_1.TokenType.AND,
    "class": token_type_1.TokenType.CLASS,
    "else": token_type_1.TokenType.ELSE,
    "false": token_type_1.TokenType.FALSE,
    "for": token_type_1.TokenType.FOR,
    "fun": token_type_1.TokenType.FUN,
    "if": token_type_1.TokenType.IF,
    "nil": token_type_1.TokenType.NIL,
    "or": token_type_1.TokenType.OR,
    "print": token_type_1.TokenType.PRINT,
    "return": token_type_1.TokenType.RETURN,
    "super": token_type_1.TokenType.SUPER,
    "this": token_type_1.TokenType.THIS,
    "true": token_type_1.TokenType.TRUE,
    "var": token_type_1.TokenType.VAR,
    "while": token_type_1.TokenType.WHILE,
};
