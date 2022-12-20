#! /usr/bin/env node

import yargs from "yargs";
import fs from "fs";
import { Lox } from "./lox";
import chalk from "chalk";

const argv = yargs.usage('使用方式：jlox --path=<FILE_PATH>')
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

fs.access(filePath, fs.constants.F_OK, err => {
    if (err) {
        console.error(chalk.red(`文件不存在`));
    } else {
        Lox.main([filePath]);
    }
})