"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lox = void 0;
const readline_1 = __importDefault(require("readline"));
const fs_1 = __importDefault(require("fs"));
const scanner_1 = require("./scanner");
const token_type_1 = require("./token-type");
const parser_1 = require("./parser");
const interpreter_1 = require("./interpreter");
const resolver_1 = require("./resolver");
class Lox {
    static main(args) {
        if (args.length > 1) {
            console.log("Usage: jlox [script]");
            process.exit(0);
        }
        else if (args.length === 1) {
            this.runFile(args[0]);
        }
        else {
            this.runPrompt();
        }
    }
    static runFile(path) {
        const data = fs_1.default.readFileSync(path, { encoding: 'utf-8' });
        this.run(data);
        if (this.hasError) {
            process.exit(65);
        }
        if (this.hasRuntimeError) {
            process.exit(70);
        }
    }
    static runPrompt() {
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });
        rl.on('line', (name) => {
            if (name === '') {
                rl.close();
                return;
            }
            this.run(name);
            // 重置 hasError 标志，交互式循环中用户出错不应该终止他们的会话
            this.hasError = false;
        });
    }
    static run(source) {
        const scanner = new scanner_1.Scanner(source);
        const tokens = scanner.scanTokens();
        const parser = new parser_1.Parser(tokens);
        const statements = parser.parse();
        if (this.hasError) {
            return;
        }
        // 存在语法错误时不运行解析器
        const resolver = new resolver_1.Resolver(this.interpreter);
        resolver.resolveStatements(statements);
        if (this.hasError) {
            return;
        }
        this.interpreter.interpret(statements);
    }
    static error(line, message) {
        if (typeof line === 'number') {
            this.report(line, '', message);
        }
        else {
            this.tokenError(line, message);
        }
    }
    static runtimeError(error) {
        console.log(error.message + "\n[line " + error.token.line + "]");
        this.hasRuntimeError = true;
    }
    static report(line, where, message) {
        console.error("[line " + line + "] Error" + where + ": " + message);
        this.hasError = true;
    }
    static tokenError(token, message) {
        if (token.type === token_type_1.TokenType.EOF) {
            this.report(token.line, ' at end', message);
        }
        else {
            this.report(token.line, ` at '${token.lexeme}'`, message);
        }
    }
}
exports.Lox = Lox;
Lox.interpreter = new interpreter_1.Interpreter();
Lox.hasError = false;
Lox.hasRuntimeError = false;
