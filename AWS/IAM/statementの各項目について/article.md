# 概要
AWSを使う上で絶対に切っても切れないのがIdentity and Access Management(以降、IAMと記載)  
今回はCDK, CloudFormationでIAM Role, Policyを作る際に出てくるStatementの部分を可能な限り解説しています  

# 記事の対象者
- IAMについて勉強したい人(初心者レベル)
- Statementの各項目について忘れてしまった人
- CDK, CloudFormationでIAM系を作る人
# 

# 参考サイト
- [IAM ロールの PassRole と AssumeRole をもう二度と忘れないために絵を描いてみた](https://dev.classmethod.jp/articles/iam-role-passrole-assumerole/)