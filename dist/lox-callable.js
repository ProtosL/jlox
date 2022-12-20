"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instanceOfLoxCallable = void 0;
const instanceOfLoxCallable = (object) => {
    return 'call' in object;
};
exports.instanceOfLoxCallable = instanceOfLoxCallable;
