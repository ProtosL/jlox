"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeError = void 0;
class RuntimeError extends Error {
    constructor(token, message) {
        super(message);
        this.token = token;
    }
}
exports.RuntimeError = RuntimeError;
