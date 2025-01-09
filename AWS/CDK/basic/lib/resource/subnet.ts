import { Construct } from "constructs";
import { CfnVPC, CfnSubnet } from "aws-cdk-lib/aws-ec2";
// 自作モジュール
import { Resource } from "./abstract/resources";

export class Subnet extends Resource {
    public publicSubnet1a: CfnSubnet;
    public publicSubnet1c: CfnSubnet;
    public privateSubnet1a: CfnSubnet;
    public privateSubnet1c: CfnSubnet;

    private readonly vpc: CfnVPC;

    constructor (vpc: CfnVPC) {
        super();
        this.vpc = vpc;
    };

    public createResource(scope: Construct) {
        const applicationName = scope.node.tryGetContext('applicationName');
        const env = scope.node.tryGetContext('env');

        this.publicSubnet1a = new CfnSubnet(scope, 'publicSubnet1a', {
            vpcId: this.vpc.ref,
            cidrBlock: '10.0.11.0/24',
            availabilityZone: 'ap-northeast-1a',
            tags: [{key: 'Name', value: this.createResourceName(scope, 'public-subnet-public-1a')}]
        });

        this.publicSubnet1c = new CfnSubnet(scope, 'publicSubnet1c', {
            vpcId: this.vpc.ref,
            cidrBlock: '10.0.12.0/24',
            availabilityZone: 'ap-northeast-1c',
            tags: [{key: 'Name', value: this.createResourceName(scope, 'public-subnet-public-1c')}]
        });

        this.privateSubnet1a = new CfnSubnet(scope, 'privateSubnet1a',{
            vpcId: this.vpc.ref,
            cidrBlock: '10.0.21.0/24',
            availabilityZone: 'ap-northeast-1a',
            tags: [{key: 'Name', value: this.createResourceName(scope, 'private-subnet-public-1a')}]
        });

        this.privateSubnet1c = new CfnSubnet(scope, 'privateSubnet1c', {
            vpcId: this.vpc.ref,
            cidrBlock: '10.0.22.0/24',
            availabilityZone: 'ap-northeast-1c',
            tags: [{key: 'Name', value: this.createResourceName(scope, 'private-subnet-public-1c')}]
        });
    }
};