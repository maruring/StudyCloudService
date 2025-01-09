import { Construct } from "constructs";
import { CfnInternetGateway, CfnVPCGatewayAttachment, CfnVPC } from "aws-cdk-lib/aws-ec2";

import { Resource } from "./abstract/resources";
import { Scope } from "aws-cdk-lib/aws-ecs";

export class InternetGateway extends Resource {
    public internetGateay: CfnInternetGateway;
    private readonly vpc: CfnVPC;

    constructor (vpc: CfnVPC) {
        super();
        this.vpc = vpc;
    }

    createResource(scope: Construct): void {
        this.internetGateay = new CfnInternetGateway(scope, 'InternetGateay', {
            tags: [{key: 'Name', value: this.createResourceName(scope, 'igw')}]
        });

        new CfnVPCGatewayAttachment(scope, 'VpcGatewayAttachment',{
            vpcId: this.vpc.ref,
            internetGatewayId: this.internetGateay.ref
        })
    }
}