#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { L2ServerlessStack } from '../lib/l2_serverless-stack';

type Env = 'dev' | 'stg' | 'prod';
type EnvPascal = 'Dev' | 'Stg' | 'Prod';

export interface EnvProps {
  'env': Env;
  'envPascal': EnvPascal;
  'applicationName': string
};

const app = new cdk.App();

const ARG_ENV_CONTEXT = 'environment';
const env: Env = app.node.tryGetContext(ARG_ENV_CONTEXT);

let envPascal: EnvPascal;
if (env === 'stg') {
  envPascal = 'Stg';
} else if (env === 'prod') {
  envPascal = 'Prod'
} else {
  envPascal = 'Dev'
};

const envProps: EnvProps = {env: env, envPascal: envPascal, applicationName: 'L2ServerLess'};

new L2ServerlessStack(app, 'L2ServerlessStack', envProps, {});