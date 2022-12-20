"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expr = void 0;
var Expr;
(function (Expr_1) {
    class Expr {
    }
    Expr_1.Expr = Expr;
    class Assign extends Expr {
        constructor(name, value) {
            super();
            this.name = name;
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitAssignExpr(this);
        }
    }
    Expr_1.Assign = Assign;
    class Binary extends Expr {
        constructor(left, operator, right) {
            super();
            this.left = left;
            this.operator = operator;
            this.right = right;
        }
        accept(visitor) {
            return visitor.visitBinaryExpr(this);
        }
    }
    Expr_1.Binary = Binary;
    class Call extends Expr {
        constructor(callee, paren, argumentList) {
            super();
            this.callee = callee;
            this.paren = paren;
            this.argumentList = argumentList;
        }
        accept(visitor) {
            return visitor.visitCallExpr(this);
        }
    }
    Expr_1.Call = Call;
    class Get extends Expr {
        constructor(object, name) {
            super();
            this.object = object;
            this.name = name;
        }
        accept(visitor) {
            return visitor.visitGetExpr(this);
        }
    }
    Expr_1.Get = Get;
    class Grouping extends Expr {
        constructor(expression) {
            super();
            this.expression = expression;
        }
        accept(visitor) {
            return visitor.visitGroupingExpr(this);
        }
    }
    Expr_1.Grouping = Grouping;
    class Literal extends Expr {
        constructor(value) {
            super();
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitLiteralExpr(this);
        }
    }
    Expr_1.Literal = Literal;
    class Logical extends Expr {
        constructor(left, operator, right) {
            super();
            this.left = left;
            this.operator = operator;
            this.right = right;
        }
        accept(visitor) {
            return visitor.visitLogicalExpr(this);
        }
    }
    Expr_1.Logical = Logical;
    class Set extends Expr {
        constructor(object, name, value) {
            super();
            this.object = object;
            this.name = name;
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitSetExpr(this);
        }
    }
    Expr_1.Set = Set;
    class Super extends Expr {
        constructor(keyword, method) {
            super();
            this.keyword = keyword;
            this.method = method;
        }
        accept(visitor) {
            return visitor.visitSuperExpr(this);
        }
    }
    Expr_1.Super = Super;
    class This extends Expr {
        constructor(keyword) {
            super();
            this.keyword = keyword;
        }
        accept(visitor) {
            return visitor.visitThisExpr(this);
        }
    }
    Expr_1.This = This;
    class Unary extends Expr {
        constructor(operator, right) {
            super();
            this.operator = operator;
            this.right = right;
        }
        accept(visitor) {
            return visitor.visitUnaryExpr(this);
        }
    }
    Expr_1.Unary = Unary;
    class Variable extends Expr {
        constructor(name) {
            super();
            this.name = name;
        }
        accept(visitor) {
            return visitor.visitVariableExpr(this);
        }
    }
    Expr_1.Variable = Variable;
})(Expr = exports.Expr || (exports.Expr = {}));
