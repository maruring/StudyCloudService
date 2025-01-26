#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TodoListStack } from '../lib/todo-list-stack';

type EnvCamelCase = 'dev' | 'stg' | 'prod';
type EnvPascalCase = 'Dev' | 'Stg' | 'Prod';

export interface EnvProps {
    envCamelCase: EnvCamelCase;
    envPascalCase: EnvPascalCase;
    applicationName: string;
};

const app = new cdk.App();

// 環境変数のパラメータはAppレベルから
const argEnvContext = 'environment';
const env: EnvCamelCase = app.node.tryGetContext(argEnvContext);

let envPascalCase: EnvPascalCase;
if (env === 'stg') {
    envPascalCase = 'Stg'
} else if (env === 'prod') {
    envPascalCase = 'Prod'
} else  {
    envPascalCase = 'Dev'
}

const envProps: EnvProps = {
    envCamelCase: env,
    envPascalCase: envPascalCase,
    applicationName: 'ToDoList'
}

new TodoListStack(app, 'TodoListStack', envProps, {});
