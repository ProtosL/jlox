/**
 * 执行该文件会覆盖 lib 下的文件
 */
import fs from 'fs';

class GenerateAst {
    public static run(outputDir: string) {
        this.defineAst(outputDir, "Expr", [
            "Assign   | name: Token, value: Expr",
            "Binary   | left: Expr, operator: Token, right: Expr",
            "Call     | callee: Expr, paren: Token, argumentList: Expr[]",
            "Get      | object: Expr, name: Token",
            "Grouping | expression: Expr",
            "Literal  | value: Nullable<Object>",
            "Logical  | left: Expr, operator: Token, right: Expr",
            "Set      | object: Expr, name: Token, value: Expr",
            "Super    | keyword: Token, method: Token",
            "This     | keyword: Token",
            "Unary    | operator: Token, right: Expr",
            "Variable | name: Token"
        ], [
            "import { Nullable } from '../type.d';"
        ])

        this.defineAst(outputDir, "Stmt", [
            "Block      | statements: Stmt[]",
            "Class      | name: Token, superclass: Nullable<Expr.Variable>, methods: Stmt.Function[]",
            "Expression | expression: Expr.Expr",
            "Function   | name: Token, params: Token[], body: Stmt[]",
            "If         | condition: Expr.Expr, thenBranch: Stmt, elseBranch: Nullable<Stmt>",
            "Print      | expression: Expr.Expr",
            "Return     | keyword: Token, value: Nullable<Expr.Expr>",
            "Var        | name: Token, initializer: Expr.Expr",
            "While      | condition: Expr.Expr, body: Stmt"
        ], [
            "import { Nullable } from '../type.d';",
            "import { Expr } from './expr';",
        ])
    }

    private static camel2dash(str: string) {
        return str.replace(/\B([A-Z])/g, '-$1').toLowerCase()
    }

    private static defineAst(outputDir: string, baseName: string, types: string[], customImport: string[]) {
        const path = `${outputDir}/${this.camel2dash(baseName)}.ts`;
        fs.mkdirSync(outputDir, { recursive: true });

        const slashNum = outputDir.split('/').length;
        const hierarchyNum = outputDir.startsWith('./') ? slashNum - 1 : slashNum;
        const pathPrefix = hierarchyNum ? new Array(hierarchyNum).fill('../').join('') : './';
        
        fs.writeFileSync(path, `import { Token } from '${pathPrefix}token';`);
        fs.appendFileSync(path, '\n');
        customImport.forEach(c => {
            fs.appendFileSync(path, c);
            fs.appendFileSync(path, '\n');
        })

        fs.appendFileSync(path, `
export namespace ${baseName} {`)

        this.defineVisitor(path, baseName, types);
        fs.appendFileSync(path, '\n');

        fs.appendFileSync(path, `
    export abstract class ${baseName} {
        abstract accept<R>(visitor: Visitor<R>): R;
    }`)

        types.forEach(t => {
            const className = t.split('|')[0].trim();
            const fields = t.split('|')[1].trim();
            this.defineType(path, baseName, className, fields);
        })
        fs.appendFileSync(path, '\n');
        fs.appendFileSync(path, `}`)
        fs.appendFileSync(path, '\n');
    }

    private static defineVisitor(path: string, baseName: string, types: string[]) {
        fs.appendFileSync(path, `
    export interface Visitor<R> {`)

        types.forEach(type => {
            const typeName = type.split('|')[0].trim();
            fs.appendFileSync(path, `
        visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}): R;`)
        })

        fs.appendFileSync(path, `
    }`)
    }

    private static defineType(path: string, baseName: string, className: string, fieldList: string) {
        fs.appendFileSync(path, `\n
    export class ${className} extends ${baseName} {`)

        const fields = fieldList.split(', ');
        fields.forEach(f => {
            fs.appendFileSync(path, `
        readonly ${f};`)
        })

        // constructor
        fs.appendFileSync(path, `\n
        constructor(${fieldList}) {
            super();`)

        // 初始化 fields
        fields.forEach(f => {
            const name = f.split(': ')[0];
            fs.appendFileSync(path, `
            this.${name} = ${name};`)
        })

        fs.appendFileSync(path, `\n`)
        fs.appendFileSync(path, `        }\n\n`)

        fs.appendFileSync(path, `        accept<R>(visitor: Visitor<R>): R {\n`);
        fs.appendFileSync(path, `            return visitor.visit${className}${baseName}(this);\n`);
        fs.appendFileSync(path, "        }\n");
        fs.appendFileSync(path, `    }`)
    }
}

GenerateAst.run('./lib')