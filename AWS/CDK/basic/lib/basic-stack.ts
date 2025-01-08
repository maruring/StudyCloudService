import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// 独自モジュール
import { Vpc } from './resource/vpc';
import { Subnet } from './resource/subnet';


export class BasicStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new Vpc();
    vpc.createResource(this);

    // Subnet
    const subnet = new Subnet(vpc.vpc);
    subnet.createResource(this);
  }
};
