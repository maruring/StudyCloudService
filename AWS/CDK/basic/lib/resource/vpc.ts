import { Construct } from 'constructs';
import { CfnVPC } from 'aws-cdk-lib/aws-ec2';
// 自作モジュール
import { Resource } from './abstract/resources';

export class Vpc extends Resource {
    public vpc: CfnVPC;

    constructor () {
        super();
    };

    public createResource(scope: Construct) {
        this.vpc = new CfnVPC(scope, 'Vpc', {
            cidrBlock: '10.0.0.0/16',
            tags: [{key: 'Name', value: this.createResourceName(scope, 'vpc')}]
        });
    }
};