# スケジュール生成エンジン設計書

## 概要

図書委員の当番スケジュールを自動生成するためのエンジンを設計・実装する。このエンジンは`database_design.md`で定義されたテーブル構造を使用し、指定されたルールに従って図書委員を曜日単位で割り当てる。生成されたスケジュールは`schedules`テーブルと`schedule_assignments`テーブルに格納される。

## 要件

### 基本要件
- 5年、6年生が担当（database_design.mdでは全学年対応だが、運用上は5-6年生を想定）
- 各学年は2以上の任意クラスで構成
- 各クラスには、2−3人の図書委員がいる
- 図書室は複数あり、database_design.mdの`library_rooms`テーブルから取得
- 月曜日から金曜日に図書委員の当番を割り当てる（曜日コード：1-5）
- 予定表は、年二回作成し当番を入れ替える（前期・後期）
- 前半、水曜日と金曜日の当番だった図書委員は、後半水曜日と金曜日の担当とならないようにする
- 各図書委員は、週二回担当日がある
- 同じクラスの図書員は同じ曜日の担当とならないようにする
- 各学年の委員が均等に配置、曜日によって偏らないようにする
- 割り当ては曜日単位で行い、日単位では行わない

### データベース制約
- アクティブな図書委員のみを対象（`active = TRUE`）
- 指定された学年度（`academic_year`）の図書委員のみを対象
- 役職（`position_id`）を考慮した適切な配置

## クラス設計

### `ScheduleGenerator` クラス


#### 属性

- `school_id`: 学校ID（外部キー）
- `committee_members`: 図書委員リスト（committee_membersテーブルから取得）
- `library_rooms`: 図書室リスト（library_roomsテーブルから取得）
- `classes`: クラス情報リスト（classesテーブルから取得）
- `positions`: 役職情報リスト（positionsテーブルから取得）
- `schedule_id`: 生成されたスケジュールID
- `is_first_half`: 前期か後期かのフラグ
- `academic_year`: 学年度
- `previous_assignments`: 前期の割り当て情報（後期生成時のローテーション用）

#### メソッド

- `__init__(self, school_id: int, academic_year: int, is_first_half: bool)`: コンストラクタ
- `load_committee_members(self) -> List[Dict]`: アクティブな図書委員データの読み込み
- `load_library_rooms(self) -> List[Dict]`: アクティブな図書室データの読み込み
- `load_classes(self) -> List[Dict]`: クラス情報の読み込み
- `load_positions(self) -> List[Dict]`: 役職情報の読み込み
- `load_previous_assignments(self) -> Dict`: 前期の割り当て情報の読み込み（後期生成時）
- `create_schedule(self, name: str, description: str) -> int`: スケジュールの基本情報を作成
- `validate_constraints(self) -> bool`: 制約条件の検証
- `assign_members_to_weekdays(self) -> Dict`: 図書委員を曜日に割り当て
- `apply_rotation_rules(self, assignments: Dict) -> Dict`: ローテーションルールの適用
- `validate_assignments(self, assignments: Dict) -> List[str]`: 割り当て結果の検証
- `save_assignments(self, assignments: Dict, schedule_id: int) -> None`: 割り当てをschedule_assignmentsテーブルに保存
- `generate(self, name: str, description: str) -> Dict`: スケジュール生成のメインメソッド

## アルゴリズム概要

### フェーズ1: データ読み込みと検証
1. 学校ID、学年度、前期/後期の情報を受け取る
2. 必要なマスタデータを読み込む：
   - アクティブな図書委員（`committee_members`テーブル、`active=TRUE`, 指定学年度）
   - アクティブな図書室（`library_rooms`テーブル、`active=TRUE`）
   - クラス情報（`classes`テーブル、学年フィルタ）
   - 役職情報（`positions`テーブル）
3. 後期の場合、前期の割り当て情報を読み込む（`schedule_assignments`テーブル）
4. 制約条件の検証（委員数、図書室数など）

### フェーズ2: 割り当てアルゴリズム
5. スケジュールの基本情報を`schedules`テーブルに作成
6. 曜日ごとに図書委員を割り当てる：
   - 各図書委員が週2回担当になるよう割り当て
   - 同じクラスの図書委員が同じ曜日にならないよう調整
   - 各学年の委員が均等に配置されるよう調整
   - 役職を考慮した適切な配置
   - 後期の場合、前期に水曜・金曜担当だった委員は水曜・金曜に割り当てない

### フェーズ3: 検証と保存
7. 割り当て結果の検証（ルール違反チェック）
8. 割り当て結果を`schedule_assignments`テーブルに保存
9. 結果サマリー（成功/失敗、統計情報）を返す

## データベーステーブル構造

### 使用するテーブル

#### 1. `schedules`テーブル（スケジュール基本情報）
- `id`: スケジュールID（主キー、自動生成）
- `school_id`: 学校ID（外部キー）
- `schedule_name`: スケジュール名
- `description`: 説明
- `academic_year`: 学年度
- `is_first_half`: 前期フラグ（TRUE: 前期, FALSE: 後期）
- `status`: ステータス（'draft', 'active', 'completed'）

#### 2. `schedule_assignments`テーブル（割り当て情報）
- `id`: 割り当てID（主キー、自動生成）
- `schedule_id`: スケジュールID（外部キー）
- `day_of_week`: 曜日（1:月, 2:火, 3:水, 4:木, 5:金）
- `library_room_id`: 図書室ID（外部キー）
- `committee_member_id`: 図書委員ID（外部キー）

#### 3. 参照テーブル
- `committee_members`: 図書委員マスタ
- `library_rooms`: 図書室マスタ
- `classes`: クラスマスタ
- `positions`: 役職マスタ
- `schools`: 学校マスタ

### データ関連性
- 1つのスケジュールに対して複数の割り当て（1:N）
- 1つの割り当てに対して1人の図書委員（1:1）
- 1つの割り当てに対して1つの図書室（1:1）
- 図書委員は複数の割り当てを持つことができる（週2回ルール）

## APIエンドポイント

### `/api/generate-schedule` エンドポイント

#### リクエストパラメータ
```json
{
  "school_id": 1,
  "academicYear": 2025,      // APIではキャメルケース（データベースではacademic_year）
  "period": 1,               // 1=前期, 2=後期（データベースではis_first_half）
  "scheduleName": "2025年度前期当番表",  // APIではキャメルケース（データベースではschedule_name）
  "description": "2025年度前期の図書委員当番割り当て"
}
```

**フィールドマッピング注意点**：
- フロントエンドAPIはキャメルケースを使用
- バックエンドで自動的にスネークケースに変換
- `period`は数値型（1または2）で、内部的に`is_first_half`ブール値に変換

#### レスポンス
```json
{
  "success": true,
  "schedule_id": 123,
  "message": "スケジュールが正常に生成されました",
  "statistics": {
    "total_assignments": 50,
    "total_members": 25,
    "total_libraries": 2,
    "assignments_per_member": 2.0
  },
  "warnings": [],
  "errors": []
}
```

### `/api/validate-schedule/{schedule_id}` エンドポイント
生成されたスケジュールの検証用

### `/api/schedule-stats/{schedule_id}` エンドポイント
スケジュールの統計情報取得用

## フロントエンド変更

### スケジュール生成画面の修正
- 「学年度」選択フィールドの追加（数値入力、デフォルト: 現在年度）
- 「前期/後期」ラジオボタンの追加
- 「学校ID」の自動設定（ログインユーザーの学校情報から取得）
- スケジュール名とメモの入力フィールド
- 生成ボタンとプレビュー機能
- 生成完了後は自動的にスケジュール検証画面へ遷移

### スケジュール検証画面の機能
- **年度選択ドロップダウン**：スケジュールが存在する年度のみ表示（複数年度対応）
- **前期・後期の並列表示**：
  - 各期のスケジュールを独立したテーブルで表示
  - 図書室を行、曜日を列とした割り当て表形式
  - 委員名とクラス名を同一バッジ内に表示（例：「5-1 田中太郎」）
- **承認ステータス管理**：
  - 各スケジュールの承認状態をバッジで表示（承認済み/未承認）
  - 未承認の場合は「承認する」「再生成」ボタンを表示
  - 承認済みの場合はボタンを非表示
- **ナビゲーション改善**：
  - `/schedule/verify`から`/management/validate-schedule`へのリダイレクト
  - URLパラメータによるスケジュールID指定に対応

### APIとの連携
- `/api/generate-schedule`エンドポイントへのPOSTリクエスト
  - キャメルケース形式でパラメータ送信（academicYear, period, scheduleName）
- `/api/schedules`エンドポイントからの一覧取得
  - 年度フィルタリングのための`academic_year`フィールド使用
- エラーハンドリングとユーザーフィードバック
- 生成プロセスの進行状況表示（可能であれば）

### 検証機能の統合
- 生成後の自動検証
- 検証結果の視覚的表示
- 問題がある場合の修正提案
