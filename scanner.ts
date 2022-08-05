import { Token } from './token';
import { TokenType } from './token-type';
import { Lox } from './lox';

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

    private scanToken() {
        // current 指向 c 的下一个字符
        const c = this.advance();

        switch(c) {
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': this.addToken(TokenType.DOT); break;
            case '-': this.addToken(TokenType.MINUS); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '*': this.addToken(TokenType.STAR); break; 

            // ! 后面可能跟着 = ，即 != ，这种时候要作为一个整体
            case '!':
                this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
                break;
            case '=':
                this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;

            case '/':
                if (this.match('/')) {
                    while(this.peek() !== '\n' && !this.isAtEnd()) {
                        this.advance();
                    }
                } else {
                    this.addToken(TokenType.SLASH);
                }

            // 跳过空白字符
            case ' ':
            case '\r':
            case '\t':
                break;

            // 换行时行号加一
            case '\n':
                this.line++;
                break;

            case '"': this.string(); break;

            default:
                // 不中断扫描，该方法已经设置了 hasError 为 true，不会去执行代码
                Lox.error(this.line, 'Unexpected character.')
                break;
        }

    }

    private string() {
        while(this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() == '\n') {
                this.line++;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            Lox.error(this.line, 'Unterminated string.')
            return ;
        }

        this.advance();

        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, value);
    }

    // 判断当前字符是不是所期望的，如果是则向前推进一位
    private match(expected: string) {
        if (this.isAtEnd()) {
            return false;
        }
        if (this.source.charAt(this.current) != expected) {
            return false;
        }

        this.current++;
        return true;
    }

    // 获取当前字符但不向前推进
    private peek() {
        if (this.isAtEnd()) {
            // return '\0';
            return '';
        }

        return this.source.charAt(this.current);
    }

    // 用于判断是否遍历完所有字符
    private isAtEnd() {
        return this.current >= this.source.length;
    }

    // 获取当前字符并向前推进一个字符
    private advance() {
        return this.source.charAt(this.current++);
    }

    // 获取当前词位的文本并创建一个标记
    private addToken(type: TokenType, literal?: Object) {
        if (literal) {
            const text = this.source.substring(this.start, this.current);
            this.tokens.push(new Token(type, text, literal, this.line));
        } else {
            this.addToken(type, undefined);
        }
    }
}