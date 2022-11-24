import { Expr } from './expr';

export namespace Stmt {
    export interface Visitor<R> {
        visitExpressionStmt(stmt: Expression): R;
        visitPrintStmt(stmt: Print): R;
    }
    
    export abstract class Stmt {
        abstract accept<R>(visitor: Visitor<R>): R;
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
}
