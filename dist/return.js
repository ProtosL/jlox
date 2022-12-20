"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Return = void 0;
class Return extends Error {
    constructor(value) {
        super();
        this.value = value;
    }
}
exports.Return = Return;
