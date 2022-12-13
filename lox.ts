import readline from 'readline';
import fs from 'fs';
import { Scanner } from './scanner';
import { TokenType } from './token-type';
import { Token } from './token';
import { Parser } from './parser';
import { AstPrinter } from './ast-printer';
import { Interpreter } from './interpreter';
import { Resolver } from './resolver';

export class Lox {
    private static readonly interpreter = new Interpreter();
    static hasError = false;
    static hasRuntimeError = false;
    
    public static main(args: string[]) {
        if (args.length > 1) {
            console.log("Usage: jlox [script]");
            process.exit(0);
        } else if (args.length === 1) {
            this.runFile(args[0]);
        } else {
            this.runPrompt();
        }
    }

    private static runFile(path: string) {
        const data = fs.readFileSync(path, { encoding: 'utf-8' });
        this.run(data);

        if (this.hasError) {
            process.exit(65);
        }
        if (this.hasRuntimeError) {
            process.exit(70);
        }
    }

    private static runPrompt() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        })
        rl.on('line', (name: string) => {
            if (name === '') {
                rl.close()
                return ;
            }
            this.run(name)

            // 重置 hasError 标志，交互式循环中用户出错不应该终止他们的会话
            this.hasError = false;
        })
    }

    private static run(source: string) {
        const scanner = new Scanner(source);
        const tokens = scanner.scanTokens();
        const parser = new Parser(tokens);
        const statements = parser.parse();

        if (this.hasError) {
            return;
        }

        // 存在语法错误时不运行解析器
        const resolver: Resolver = new Resolver(this.interpreter);
        resolver.resolveStatements(statements);

        if (this.hasError) {
            return;
        }
        
        this.interpreter.interpret(statements);
    }

    static error(line: number | Token, message: string) {
        if (typeof line === 'number') {
            this.report(line, '', message);
        } else {
            this.tokenError(line, message);
        }
    }

    static runtimeError(error: any) {
        console.log(error.message + "\n[line " + error.token.line + "]");
        this.hasRuntimeError = true;
    }

    private static report(line: number, where: string, message: string) {
        console.error("[line " + line + "] Error" + where + ": " + message);
        this.hasError = true;
    }

    static tokenError(token: Token, message: string) {
        if (token.type === TokenType.EOF) {
            this.report(token.line, ' at end', message);
        } else {
            this.report(token.line, ` at '${token.lexeme}'`, message);
        }
    }
}
Lox.main([`./test/test11`]);