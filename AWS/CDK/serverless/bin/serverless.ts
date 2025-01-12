#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ServerlessStack } from '../lib/serverless-stack';
import { StackProps } from 'aws-cdk-lib';

type envLowerCase = 'dev' | 'stg' | 'prod';
type envUpperCase = 'Dev' | 'Stg' | 'Prod';

export interface EnvProps extends StackProps {
  'envLowerCase': envLowerCase;
  'envUpperCase': envUpperCase;
  'applicationName': string;
};

const app = new cdk.App();

// 環境変数のパラメータはAppレベルから
const argEnvContext = 'environment';
const env = app.node.tryGetContext(argEnvContext);

let envUpper: envUpperCase;

if (env === 'stg') {
  envUpper = 'Stg';
} else if (env === 'prod') {
  envUpper = 'Prod';
} else {
  envUpper = 'Dev';
}

const envInfo: EnvProps = {'envLowerCase': env, 'envUpperCase': envUpper, 'applicationName': 'CdkAttempt'};

new ServerlessStack(app, `${envUpper}ServerlessStack`, envInfo, {});