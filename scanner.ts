import { Token } from './token';
import { TokenType } from './token-type';

export class Scanner {
    private readonly source: string; // 源代码
    private readonly tokens: Token[] = []; // 要生成的标记列表

    // 以下几个字段用于跟踪 scanner 在源代码中的位置
    private start = 0; // 指向正在扫描的词位的第一个字符
    private current = 0;
    private line = 1;

    constructor(source: string) {
        this.source = source;
    }

    scanTokens() {
        while(!this.isAtEnd()) {
            this.start = this.current;
            this.scanTokens();
        }

        // 扫描完再末尾加一个 EOF 标记
        this.tokens.push(new Token(TokenType.EOF, '', {}, this.line))
        return this.tokens;
    }

    // 用于判断是否遍历完所有字符
    private isAtEnd() {
        return this.current >= this.source.length;
    }
}