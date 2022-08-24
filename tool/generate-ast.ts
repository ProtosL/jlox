import fs from 'fs';

class GenerateAst {
    public static run(outputDir: string) {
        this.defineAst(outputDir, "Expr", [
            "Binary   | left: Expr, operator: Token, right: Expr",
            "Grouping | expression: Expr",
            "Literal  | value: Object",
            "Unary    | operator: Token, right: Expr"
        ])
    }

    private static camel2dash(str: string) {
        return str.replace(/\B([A-Z])/g, '-$1').toLowerCase()
    }

    private static defineAst(outputDir: string, baseName: string, types: string[]) {
        const path = `${outputDir}/${this.camel2dash(baseName)}.ts`;
        fs.mkdirSync(outputDir, { recursive: true });

        const slashNum = outputDir.split('/').length;
        const hierarchyNum = outputDir.startsWith('./') ? slashNum - 1 : slashNum;
        const pathPrefix = hierarchyNum ? new Array(hierarchyNum).fill('../').join('') : './';
        
        const data = `
import { Token } from '${pathPrefix}token';

abstract class ${baseName} {

}`
        fs.writeFileSync(path, data, { flag: 'a' })

        types.forEach(t => {
            const className = t.split('|')[0].trim();
            const fields = t.split('|')[1].trim();
            this.defineType(path, baseName, className, fields);
        })
    }

    private static defineType(path: string, baseName: string, className: string, fieldList: string) {
        fs.appendFileSync(path, `\n
class ${className} extends ${baseName} {`)

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

        fs.appendFileSync(path, `
    }
}`)
    }
}

GenerateAst.run('./test')