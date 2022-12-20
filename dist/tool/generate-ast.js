"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 执行该文件会覆盖 lib 下的文件
 */
const fs_1 = __importDefault(require("fs"));
class GenerateAst {
    static run(outputDir) {
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
        ]);
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
        ]);
    }
    static camel2dash(str) {
        return str.replace(/\B([A-Z])/g, '-$1').toLowerCase();
    }
    static defineAst(outputDir, baseName, types, customImport) {
        const path = `${outputDir}/${this.camel2dash(baseName)}.ts`;
        fs_1.default.mkdirSync(outputDir, { recursive: true });
        const slashNum = outputDir.split('/').length;
        const hierarchyNum = outputDir.startsWith('./') ? slashNum - 1 : slashNum;
        const pathPrefix = hierarchyNum ? new Array(hierarchyNum).fill('../').join('') : './';
        fs_1.default.writeFileSync(path, `import { Token } from '${pathPrefix}token';`);
        fs_1.default.appendFileSync(path, '\n');
        customImport.forEach(c => {
            fs_1.default.appendFileSync(path, c);
            fs_1.default.appendFileSync(path, '\n');
        });
        fs_1.default.appendFileSync(path, `
export namespace ${baseName} {`);
        this.defineVisitor(path, baseName, types);
        fs_1.default.appendFileSync(path, '\n');
        fs_1.default.appendFileSync(path, `
    export abstract class ${baseName} {
        abstract accept<R>(visitor: Visitor<R>): R;
    }`);
        types.forEach(t => {
            const className = t.split('|')[0].trim();
            const fields = t.split('|')[1].trim();
            this.defineType(path, baseName, className, fields);
        });
        fs_1.default.appendFileSync(path, '\n');
        fs_1.default.appendFileSync(path, `}`);
        fs_1.default.appendFileSync(path, '\n');
    }
    static defineVisitor(path, baseName, types) {
        fs_1.default.appendFileSync(path, `
    export interface Visitor<R> {`);
        types.forEach(type => {
            const typeName = type.split('|')[0].trim();
            fs_1.default.appendFileSync(path, `
        visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}): R;`);
        });
        fs_1.default.appendFileSync(path, `
    }`);
    }
    static defineType(path, baseName, className, fieldList) {
        fs_1.default.appendFileSync(path, `\n
    export class ${className} extends ${baseName} {`);
        const fields = fieldList.split(', ');
        fields.forEach(f => {
            fs_1.default.appendFileSync(path, `
        readonly ${f};`);
        });
        // constructor
        fs_1.default.appendFileSync(path, `\n
        constructor(${fieldList}) {
            super();`);
        // 初始化 fields
        fields.forEach(f => {
            const name = f.split(': ')[0];
            fs_1.default.appendFileSync(path, `
            this.${name} = ${name};`);
        });
        fs_1.default.appendFileSync(path, `\n`);
        fs_1.default.appendFileSync(path, `        }\n\n`);
        fs_1.default.appendFileSync(path, `        accept<R>(visitor: Visitor<R>): R {\n`);
        fs_1.default.appendFileSync(path, `            return visitor.visit${className}${baseName}(this);\n`);
        fs_1.default.appendFileSync(path, "        }\n");
        fs_1.default.appendFileSync(path, `    }`);
    }
}
GenerateAst.run('./lib');
