# CDK(Cloud Development Kit)
## コアフレーム
APP->Stack->Constructの要素で構成される
### APP
- コンポーネントの最上位要素
- 複数スタックの依存関係を定義
### Stack
- CloudFormationのStack
### Construct
- 1つ以上からなるAWSリソース
- ユーザーにより定義・配布が可能