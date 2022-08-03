import readline from 'readline';
import fs from 'fs';

class Lox {
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
        })
    }

    private static run(source: string) {
        console.log(source)
        // const scanner = new Scanner(source);
        // const tokens = scanner.scanner.scanTokens();

        // tokens.forEach(token => {
        //     console.log(token);
        // })
    }
}
