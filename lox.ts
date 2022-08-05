import readline from 'readline';
import fs from 'fs';
import { Scanner } from './scanner';

export class Lox {
    static hasError = false;
    
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
            process.exit(1);
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

        tokens.forEach(token => {
            console.log(token);
        })
    }

    static error(line: number, message: string) {
        this.report(line, '', message);
    }

    private static report(line: number, where: string, message: string) {
        console.error("[line " + line + "] Error" + where + ": " + message);
        this.hasError = true;
    }
}
