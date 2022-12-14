import { Token } from '../token';
import { Nullable } from '../type.d';
import { Expr } from './expr';

export namespace Stmt {
    export interface Visitor<R> {
        visitBlockStmt(stmt: Block): R;
        visitClassStmt(stmt: Class): R;
        visitExpressionStmt(stmt: Expression): R;
        visitFunctionStmt(stmt: Function): R;
        visitIfStmt(stmt: If): R;
        visitPrintStmt(stmt: Print): R;
        visitReturnStmt(stmt: Return): R;
        visitVarStmt(stmt: Var): R;
        visitWhileStmt(stmt: While): R;
    }

    export abstract class Stmt {
        abstract accept<R>(visitor: Visitor<R>): R;
    }

    export class Block extends Stmt {
        readonly statements: Stmt[];

        constructor(statements: Stmt[]) {
            super();
            this.statements = statements;
        }

        accept<R>(visitor: Visitor<R>): R {
            return visitor.visitBlockStmt(this);
        }
    }

    export class Class extends Stmt {
        readonly name: Token;
        readonly superclass: Nullable<Expr.Variable>;
        readonly methods: Stmt.Function[];

        constructor(name: Token, superclass: Nullable<Expr.Variable>, methods: Stmt.Function[]) {
            super();
            this.name = name;
            this.superclass = superclass;
            this.methods = methods;
        }

        accept<R>(visitor: Visitor<R>): R {
            return visitor.visitClassStmt(this);
        }
    }

    export class Expression extends Stmt {
        readonly expression: Expr.Expr;

        constructor(expression: Expr.Expr) {
            super();
            this.expression = expression;
        }

        accept<R>(visitor: Visitor<R>): R {
            return visitor.visitExpressionStmt(this);
        }
    }

    export class Function extends Stmt {
        readonly name: Token;
        readonly params: Token[];
        readonly body: Stmt[];

        constructor(name: Token, params: Token[], body: Stmt[]) {
            super();
            this.name = name;
            this.params = params;
            this.body = body;
        }

        accept<R>(visitor: Visitor<R>): R {
            return visitor.visitFunctionStmt(this);
        }
    }

    export class If extends Stmt {
        readonly condition: Expr.Expr;
        readonly thenBranch: Stmt;
        readonly elseBranch: Nullable<Stmt>;

        constructor(condition: Expr.Expr, thenBranch: Stmt, elseBranch: Nullable<Stmt>) {
            super();
            this.condition = condition;
            this.thenBranch = thenBranch;
            this.elseBranch = elseBranch;
        }

        accept<R>(visitor: Visitor<R>): R {
            return visitor.visitIfStmt(this);
        }
    }

    export class Print extends Stmt {
        readonly expression: Expr.Expr;

        constructor(expression: Expr.Expr) {
            super();
            this.expression = expression;
        }

        accept<R>(visitor: Visitor<R>): R {
            return visitor.visitPrintStmt(this);
        }
    }

    export class Return extends Stmt {
        readonly keyword: Token;
        readonly value: Nullable<Expr.Expr>;

        constructor(keyword: Token, value: Nullable<Expr.Expr>) {
            super();
            this.keyword = keyword;
            this.value = value;
        }

        accept<R>(visitor: Visitor<R>): R {
            return visitor.visitReturnStmt(this);
        }
    }

    export class Var extends Stmt {
        readonly name: Token;
        readonly initializer: Expr.Expr;

        constructor(name: Token, initializer: Expr.Expr) {
            super();
            this.name = name;
            this.initializer = initializer;
        }

        accept<R>(visitor: Visitor<R>): R {
            return visitor.visitVarStmt(this);
        }
    }

    export class While extends Stmt {
        readonly condition: Expr.Expr;
        readonly body: Stmt;

        constructor(condition: Expr.Expr, body: Stmt) {
            super();
            this.condition = condition;
            this.body = body;
        }

        accept<R>(visitor: Visitor<R>): R {
            return visitor.visitWhileStmt(this);
        }
    }
}
