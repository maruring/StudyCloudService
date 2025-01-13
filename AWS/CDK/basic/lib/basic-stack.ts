import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// 独自モジュール
import { Vpc } from './resource/vpc';
import { Subnet } from './resource/subnet';
import { InternetGateway } from './resource/internet-gateway';
import { ElasticIp } from './resource/elasticIp';
import { NatGateway } from './resource/nat-gateway';
import { RouteTable } from './resource/routeTable';

export class BasicStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new Vpc();
    vpc.createResource(this);

    // Subnet
    const subnet = new Subnet(vpc.vpc);
    subnet.createResource(this);

    // InternetGateway
    const internetGateway = new InternetGateway(vpc.vpc);
    internetGateway.createResource(this);

    // EIP
    const elasticIp = new ElasticIp();
    elasticIp.createResource(this);

    // NatGateway
    const natGateway = new NatGateway(
      elasticIp.ngw1a,
      elasticIp.ngw1c,
      subnet.publicSubnet1a,
      subnet.publicSubnet1c
    );
    natGateway.createResource(this);

    // RouteTable
    const routeTable = new RouteTable(
      vpc.vpc,
      subnet.publicSubnet1a,
      subnet.publicSubnet1c,
      subnet.privateSubnet1a,
      subnet.privateSubnet1c,
      internetGateway.internetGateay,
      natGateway.natGateway1a,
      natGateway.natGateway1c
    );
    routeTable.createResource(this);
  }
};
