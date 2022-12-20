"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stmt = void 0;
var Stmt;
(function (Stmt_1) {
    class Stmt {
    }
    Stmt_1.Stmt = Stmt;
    class Block extends Stmt {
        constructor(statements) {
            super();
            this.statements = statements;
        }
        accept(visitor) {
            return visitor.visitBlockStmt(this);
        }
    }
    Stmt_1.Block = Block;
    class Class extends Stmt {
        constructor(name, superclass, methods) {
            super();
            this.name = name;
            this.superclass = superclass;
            this.methods = methods;
        }
        accept(visitor) {
            return visitor.visitClassStmt(this);
        }
    }
    Stmt_1.Class = Class;
    class Expression extends Stmt {
        constructor(expression) {
            super();
            this.expression = expression;
        }
        accept(visitor) {
            return visitor.visitExpressionStmt(this);
        }
    }
    Stmt_1.Expression = Expression;
    class Function extends Stmt {
        constructor(name, params, body) {
            super();
            this.name = name;
            this.params = params;
            this.body = body;
        }
        accept(visitor) {
            return visitor.visitFunctionStmt(this);
        }
    }
    Stmt_1.Function = Function;
    class If extends Stmt {
        constructor(condition, thenBranch, elseBranch) {
            super();
            this.condition = condition;
            this.thenBranch = thenBranch;
            this.elseBranch = elseBranch;
        }
        accept(visitor) {
            return visitor.visitIfStmt(this);
        }
    }
    Stmt_1.If = If;
    class Print extends Stmt {
        constructor(expression) {
            super();
            this.expression = expression;
        }
        accept(visitor) {
            return visitor.visitPrintStmt(this);
        }
    }
    Stmt_1.Print = Print;
    class Return extends Stmt {
        constructor(keyword, value) {
            super();
            this.keyword = keyword;
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitReturnStmt(this);
        }
    }
    Stmt_1.Return = Return;
    class Var extends Stmt {
        constructor(name, initializer) {
            super();
            this.name = name;
            this.initializer = initializer;
        }
        accept(visitor) {
            return visitor.visitVarStmt(this);
        }
    }
    Stmt_1.Var = Var;
    class While extends Stmt {
        constructor(condition, body) {
            super();
            this.condition = condition;
            this.body = body;
        }
        accept(visitor) {
            return visitor.visitWhileStmt(this);
        }
    }
    Stmt_1.While = While;
})(Stmt = exports.Stmt || (exports.Stmt = {}));
