#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const fs_1 = __importDefault(require("fs"));
const lox_1 = require("./lox");
const chalk_1 = __importDefault(require("chalk"));
const argv = yargs_1.default.usage('使用方式：jlox --path=<FILE_PATH>')
    .options({
    path: {
        alias: 'p',
        type: 'string',
        describe: '文件路径',
        demandOption: true
    }
})
    .alias('version', 'v')
    .help('h')
    .alias('h', 'help')
    .parseSync();
const { path: filePath } = argv;
fs_1.default.access(filePath, fs_1.default.constants.F_OK, err => {
    if (err) {
        console.error(chalk_1.default.red(`文件不存在`));
    }
    else {
        lox_1.Lox.main([filePath]);
    }
});
