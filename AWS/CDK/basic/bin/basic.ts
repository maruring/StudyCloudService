#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BasicStack } from '../lib/basic-stack';

const app = new cdk.App();
new BasicStack(app, 'BasicStack', {
});