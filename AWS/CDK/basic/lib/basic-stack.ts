import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { CfnVPC } from 'aws-cdk-lib/aws-ec2';


export class BasicStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // NOTE: cdk.jsonに記載したcontextから値を取得
    const applicationName = this.node.tryGetContext('applicationName');
    const env = this.node.tryGetContext('env');

    new CfnVPC(this, 'Vpc', {
      cidrBlock: '10.0.0.0/16',
      tags: [{key: 'Name', value: `${applicationName}-${env}`}]
    }
    );
  }
}
