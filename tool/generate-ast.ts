/**
 * 执行该文件会覆盖 lib 下的文件
 */
import fs from 'fs';

class GenerateAst {
    public static run(outputDir: string) {
        this.defineAst(outputDir, "Expr", [
            "Binary   | left: Expr, operator: Token, right: Expr",
            "Grouping | expression: Expr",
            "Literal  | value: Nullable<Object>",
            "Unary    | operator: Token, right: Expr"
        ], [
            "import { Nullable } from '../type.d';"
        ])

        this.defineAst(outputDir, "Stmt", [
            "Expression | expression: Expr.Expr",
            "Print      | expression: Expr.Expr",
            "Var        | name: Token, initializer: Expr.Expr"
        ], [
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