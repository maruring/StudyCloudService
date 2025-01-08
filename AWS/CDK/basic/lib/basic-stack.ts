import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { CfnVPC, CfnSubnet } from 'aws-cdk-lib/aws-ec2';


export class BasicStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // NOTE: cdk.jsonに記載したcontextから値を取得
    const applicationName = this.node.tryGetContext('applicationName');
    const env = this.node.tryGetContext('env');

    const vpc = new CfnVPC(this, 'Vpc', {
      cidrBlock: '10.0.0.0/16',
      tags: [{key: 'Name', value: `${applicationName}-${env}-vpc`}]
    });

    const publicSubnet1a = new CfnSubnet(this, 'publicSubnet1a', {
      vpcId: vpc.ref,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: 'ap-northeast-1a',
      tags: [{key: 'Name', value: `${applicationName}-${env}-subnet-public-1a`}]
    });

    const publicSubnet1c = new CfnSubnet(this, 'publicSubnet1c', {
      vpcId: vpc.ref,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: 'ap-northeast-1c',
      tags: [{key: 'Name', value: `${applicationName}-${env}-subnet-public-1c`}]
    });

    const privateSubnet1a = new CfnSubnet(this, 'privateSubnet1a',{
      vpcId: vpc.ref,
      cidrBlock: '10.0.21.0/24',
      availabilityZone: 'ap-northeast-1a',
      tags: [{key: 'Name', value: `${applicationName}-${env}-subnet-private-1a`}]
    });

    const privateSubnet1c = new CfnSubnet(this, 'privateSubnet1c', {
      vpcId: vpc.ref,
      cidrBlock: '10.0.22.0/24',
      availabilityZone: 'ap-northeast-1c',
      tags: [{key: 'Name', value: `${applicationName}-${env}-subnet-private-1c`}]
    });
  }
};
