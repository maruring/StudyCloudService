import { Construct } from 'constructs';
import { CfnVPC } from 'aws-cdk-lib/aws-ec2';

export class Vpc {
    public vpc: CfnVPC;

    constructor () {};

    public createResource(scope: Construct) {
        // NOTE: cdk.jsonに記載したcontextから値を取得
        const applicationName = scope.node.tryGetContext('applicationName');
        const env = scope.node.tryGetContext('env');

        this.vpc = new CfnVPC(scope, 'Vpc', {
            cidrBlock: '10.0.0.0/16',
            tags: [{key: 'Name', value: `${applicationName}-${env}-vpc`}]
        });
    }
};