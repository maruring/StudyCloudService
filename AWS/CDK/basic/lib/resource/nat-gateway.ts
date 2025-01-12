import { Construct } from "constructs";
import { CfnSubnet, CfnEIP, CfnNatGateway } from "aws-cdk-lib/aws-ec2";
// 自作モジュール
import { Resource } from "./abstract/resources";

interface ResouceInfo {
    readonly id: string,
    readonly resouceName: string;
    readonly allocationId: () => string;
    readonly subnetId: () => string;
    readonly assign: (natGateway: CfnNatGateway) => void;
};

export class NatGateway extends Resource {
    public natGateway1a: CfnNatGateway;
    public natGateway1c: CfnNatGateway;

    private elasticIp1a: CfnEIP;
    private elasticIp1c: CfnEIP;
    private subnet1a: CfnSubnet;
    private subnet1c: CfnSubnet;
    
    private readonly resoucesInfo: ResouceInfo[] = [
        {
            id: 'NatGateway1a',
            resouceName: 'nat-gateway-1a',
            allocationId: () => this.elasticIp1a.attrAllocationId,
            subnetId: () => this.subnet1a.ref,
            assign: natgateway => this.natGateway1a = natgateway
        },
        {
            id: 'NatGateway1c',
            resouceName: 'nat-gateway-1c',
            allocationId: () => this.elasticIp1c.attrAllocationId,
            subnetId: () => this.subnet1c.ref,
            assign: natgateway => this.natGateway1c = natgateway
        },
    ];

    constructor (
        elasticIp1a: CfnEIP,
        elasticIp1c: CfnEIP,
        subnet1a: CfnSubnet,
        subnet1c: CfnSubnet
    ) {
        super();
        this.elasticIp1a = elasticIp1a;
        this.elasticIp1c = elasticIp1c;
        this.subnet1a = subnet1a;
        this.subnet1c = subnet1c;
    }

    createResource(scope: Construct): void {
        this.resoucesInfo.forEach((resouceInfo) => {
            const natGateway = this.createNatGateway(scope, resouceInfo);
            resouceInfo.assign(natGateway)
        })
    }

    private createNatGateway(scope: Construct, resouceInfo: ResouceInfo): CfnNatGateway {
        const natGateway = new CfnNatGateway(scope, resouceInfo.id, {
            allocationId: resouceInfo.allocationId(),
            subnetId: resouceInfo.subnetId(),
            tags: [{key: 'Name', value: this.createResourceName(scope, resouceInfo.resouceName)}]
        });

        return natGateway;
    }
}