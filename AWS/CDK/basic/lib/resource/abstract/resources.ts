// 抽象化モジュール
import { Construct } from 'constructs';

export abstract class Resource {
    constructor () {};

    abstract createResource(scope: Construct): void;

    protected createResourceName(scope: Construct, name: string): string {
        // NOTE: cdk.jsonに記載したcontextから値を取得
        const applicationName = scope.node.getContext('applicationName');
        const env = scope.node.getContext('env');

        const resourceNamePrefix = `${applicationName}-${name}-${env}`;

        return resourceNamePrefix;
    };
};
