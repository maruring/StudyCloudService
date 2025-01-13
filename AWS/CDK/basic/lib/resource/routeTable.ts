import { Construct } from "constructs";
import { CfnRoute, CfnRouteTable, CfnVPC, CfnSubnet, CfnSubnetRouteTableAssociation, CfnInternetGateway, CfnNatGateway } from "aws-cdk-lib/aws-ec2";
// 独自モジュール
import { Resource } from "./abstract/resources";

interface RouteInfo {
    readonly id: string;
    readonly destinationCidrBlock: string;
    readonly gatewayId?: () => string;
    readonly natGatewayId?: () => string;
}

interface AssociationInfo {
    readonly id: string;
    readonly subnetId: () => string;
}

interface ResouceInfo {
    readonly id: string;
    readonly resouceName: string;
    readonly routes: RouteInfo[];
    readonly associations: AssociationInfo[];
    readonly assign: (routeTable: CfnRouteTable) => void;
}

export class RouteTable extends Resource {
    public publicRoute: CfnRouteTable;
    public privateRoute1a: CfnRouteTable;
    public privateRoute1c: CfnRouteTable;

    private readonly vpc: CfnVPC;
    private readonly subnetPublic1a: CfnSubnet;
    private readonly subnetPublic1c: CfnSubnet;
    private readonly subnetPrivate1a: CfnSubnet;
    private readonly subnetPrivate1c: CfnSubnet;
    private readonly internetGateway: CfnInternetGateway;
    private readonly natGateway1a: CfnNatGateway;
    private readonly natGateway1c: CfnNatGateway;
    private readonly resoucesInfo: ResouceInfo[] = [
        {
            id: 'RouteTablePublic',
            resouceName: 'rtb-public',
            routes: [{
                id: 'RoutePublic',
                destinationCidrBlock: '0.0.0.0/0',
                gatewayId: () => this.internetGateway.ref
            }],
            associations: [
                {
                    id: 'AssociationPublic1a',
                    subnetId: () => this.subnetPublic1a.ref
                },
                {
                    id: 'AssociationPublic1c',
                    subnetId: () => this.subnetPublic1c.ref
                }
            ],
            assign: routeTable => this.publicRoute = routeTable
        },
        {
            id: 'RouteTablePrivate1a',
            resouceName: 'rtb-private1a',
            routes: [{
                id: 'RoutePrivate1a',
                destinationCidrBlock: '0.0.0.0/0',
                natGatewayId: () => this.natGateway1a.ref
            }],
            associations: [{
                id: 'AssociationPrivate1a',
                subnetId: () => this.subnetPrivate1a.ref
            }],
            assign: routeTable => this.privateRoute1a = routeTable
        },
        {
            id: 'RouteTablePrivate1c',
            resouceName: 'rtb-private1c',
            routes: [{
                id: 'RoutePrivate1c',
                destinationCidrBlock: '0.0.0.0/0',
                natGatewayId: () => this.natGateway1c.ref
            }],
            associations: [{
                id: 'AssociationPrivate1c',
                subnetId: () => this.subnetPrivate1c.ref
            }],
            assign: routeTable => this.privateRoute1c = routeTable
        },
    ];

    constructor (
        vpc: CfnVPC,
        subnetPublic1a: CfnSubnet,
        subnetPublic1c: CfnSubnet,
        subnetPrivate1a: CfnSubnet,
        subnetPrivate1c: CfnSubnet,
        internetGateway: CfnInternetGateway,
        natGateway1a: CfnNatGateway,
        natGateway1c: CfnNatGateway
    ) {
        super();
        this.vpc = vpc;
        this.subnetPublic1a = subnetPublic1a;
        this.subnetPublic1c = subnetPublic1c;
        this.subnetPrivate1a = subnetPrivate1a;
        this.subnetPrivate1c = subnetPrivate1c;
        this.internetGateway = internetGateway;
        this.natGateway1a = natGateway1a;
        this.natGateway1c = natGateway1c;
    }

    createResource(scope: Construct): void {
        this.resoucesInfo.forEach((resouceInfo) => {
            const routeTable = this.createRouteTable(scope, resouceInfo);
            resouceInfo.assign(routeTable);
        })
    }

    private createRouteTable(scope: Construct, resouceInfo: ResouceInfo) {
        const routeTable = new CfnRouteTable(scope, resouceInfo.id, {
            vpcId: this.vpc.ref,
            tags: [{
                key: 'Name',
                value: this.createResourceName(scope, resouceInfo.resouceName)
            }]
        });

        resouceInfo.routes.forEach((route) => {
            this.createRoute(scope, route, routeTable);
        })

        resouceInfo.associations.forEach((association) => {
            this.createAssociation(scope, association, routeTable);
        })

        return routeTable;
    }

    private createRoute(scope: Construct, routeInfo: RouteInfo, routeTable: CfnRouteTable) {
        const route = new CfnRoute(scope, routeInfo.id, {
            routeTableId: routeTable.ref,
            destinationCidrBlock: routeInfo.destinationCidrBlock
        });

        if (routeInfo.gatewayId) {
            route.gatewayId = routeInfo.gatewayId();
        } else if (routeInfo.natGatewayId) {
            route.natGatewayId = routeInfo.natGatewayId();
        }
    }

    private createAssociation(scope: Construct, associationInfo: AssociationInfo, routeTable: CfnRouteTable) {
        new CfnSubnetRouteTableAssociation(scope, associationInfo.id, {
            routeTableId: routeTable.ref,
            subnetId: associationInfo.subnetId()
        })
    }
}