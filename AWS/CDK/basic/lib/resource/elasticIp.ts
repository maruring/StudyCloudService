import { Construct } from "constructs";
import { CfnEIP } from "aws-cdk-lib/aws-ec2";
// 自作モジュール

import { Resource } from "./abstract/resources";

interface ResouceInfo {
    readonly id: string;
    readonly resouceName: string;
    readonly assign: (elasticIp: CfnEIP) => void;
}


export class ElasticIp extends Resource {
    public ngw1a: CfnEIP;
    public ngw1c: CfnEIP;

    private readonly resoucesInfo: ResouceInfo[] =[
        {
            id: 'ElasticIpNgw1a',
            resouceName: 'eip-ngw-1a',
            assign: elasticIp => this.ngw1a = elasticIp
        },
        {
            id: 'ElasticIpNgw1c',
            resouceName: 'eip-ngw-1c',
            assign: elasticIp => this.ngw1c = elasticIp
        }
    ];

    constructor () {
        super();
    }

    createResource(scope: Construct): void {
        this.resoucesInfo.forEach((resouceInfo) => {
            const elasticIp = this.createElasticIp(scope, resouceInfo);
            resouceInfo.assign(elasticIp);
        })
    }

    private createElasticIp(scope: Construct, resouceInfo: ResouceInfo): CfnEIP {
        const elasticIp = new CfnEIP(scope, resouceInfo.id, {
            domain: 'vpc',
            tags: [{key: 'Name', value: this.createResourceName(scope, resouceInfo.resouceName)}]
        });

        return elasticIp;
    }
}