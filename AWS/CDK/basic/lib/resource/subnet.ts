import { Construct } from "constructs";
import { CfnVPC, CfnSubnet } from "aws-cdk-lib/aws-ec2";
// 自作モジュール
import { Resource } from "./abstract/resources";

interface ResourceInfo {
    readonly id: string;
    readonly cidrBlock: string;
    readonly availabilityZone: string;
    readonly resourceName: string;
    readonly assign: (subnet: CfnSubnet) => void;
}

export class Subnet extends Resource {
    public publicSubnet1a: CfnSubnet;
    public publicSubnet1c: CfnSubnet;
    public privateSubnet1a: CfnSubnet;
    public privateSubnet1c: CfnSubnet;

    private readonly vpc: CfnVPC;
    private readonly resourcesInfo: ResourceInfo[] = [
        {
            id: 'publicSubnet1a',
            cidrBlock: '10.0.11.0/24',
            availabilityZone: 'ap-northeast-1a',
            resourceName: 'public-subnet-public-1a',
            assign: subnet => this.publicSubnet1a = subnet
        },
        {
            id: 'publicSubnet1c',
            cidrBlock: '10.0.12.0/24',
            availabilityZone: 'ap-northeast-1c',
            resourceName: 'public-subnet-public-1c',
            assign: subnet => this.publicSubnet1c = subnet
        },
        {
            id: 'privateSubnet1a',
            cidrBlock: '10.0.21.0/24',
            availabilityZone: 'ap-northeast-1a',
            resourceName: 'private-subnet-public-1a',
            assign: subnet => this.privateSubnet1a = subnet
        },
        {
            id: 'privateSubnet1c',
            cidrBlock: '10.0.22.0/24',
            availabilityZone: 'ap-northeast-1c',
            resourceName: 'private-subnet-public-1c',
            assign: subnet => this.privateSubnet1c = subnet
        }
    ]

    constructor (vpc: CfnVPC) {
        super();
        this.vpc = vpc;
    };

    public createResource(scope: Construct) {
        this.resourcesInfo.forEach((resourceInfo) => {
            const subnet = this.createSubnet(scope, resourceInfo);
            resourceInfo.assign(subnet);
        })
    }

    private createSubnet(scope: Construct, resourceInfo: ResourceInfo): CfnSubnet {
        const subnet = new CfnSubnet(scope, resourceInfo.id, {
            vpcId: this.vpc.ref,
            cidrBlock: resourceInfo.cidrBlock,
            availabilityZone: resourceInfo.availabilityZone,
            tags: [{key: 'Name', value: this.createResourceName(scope, resourceInfo.resourceName)}]
        });

        return subnet;
    }
};