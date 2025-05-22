# 図書委員当番割り当てシステム DB設計書（第一フェーズ）

## 1. 概要

本書は図書委員当番割り当てシステムの第一フェーズにおけるデータベース設計を記述したものです。システムで使用するテーブル構造、リレーションシップ、インデックス設計などを定義します。

## 2. データベース環境

- **RDBMS**: PostgreSQL 15.x (Supabase提供)
- **文字コード**: UTF-8
- **照合順序**: ja-JP.utf8

## 3. テーブル設計

### 3.1 ユーザー関連テーブル

#### 3.1.1 roles（ロール）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | ロールID |
| name | text | NO | | | | ロール名 |
| description | text | YES | | | | 説明 |
| created_at | timestamptz | YES | | | now() | 作成日時 |

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE (name)

#### 3.1.2 user_roles（ユーザーロール）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | ID |
| user_id | uuid | NO | | auth.users(id) | | ユーザーID |
| role_id | bigint | NO | | roles(id) | | ロールID |
| created_at | timestamptz | YES | | | now() | 作成日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (role_id)
- UNIQUE (user_id, role_id)

#### 3.1.3 profiles（プロフィール）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | uuid | NO | YES | auth.users(id) | | ユーザーID |
| email | text | NO | | | | メールアドレス |
| full_name | text | YES | | | | 氏名 |
| avatar_url | text | YES | | | | アバターURL |
| updated_at | timestamptz | YES | | | now() | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE (email)

### 3.2 基本情報テーブル

#### 3.2.1 grades（学年）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | 学年ID |
| name | text | NO | | | | 学年名 |
| display_order | integer | YES | | | 0 | 表示順 |
| created_at | timestamptz | YES | | | now() | 作成日時 |
| updated_at | timestamptz | YES | | | now() | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE (name)

#### 3.2.2 classes（クラス）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | クラスID |
| grade_id | bigint | NO | | grades(id) | | 学年ID |
| name | text | NO | | | | クラス名 |
| display_order | integer | YES | | | 0 | 表示順 |
| created_at | timestamptz | YES | | | now() | 作成日時 |
| updated_at | timestamptz | YES | | | now() | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (grade_id)
- UNIQUE (grade_id, name)

#### 3.2.3 positions（役職）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | 役職ID |
| name | text | NO | | | | 役職名 |
| description | text | YES | | | | 説明 |
| created_at | timestamptz | YES | | | now() | 作成日時 |

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE (name)

#### 3.2.4 committee_members（図書委員）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | 図書委員ID |
| profile_id | uuid | YES | | profiles(id) | | ユーザープロフィールID |
| name | text | NO | | | | 氏名 |
| class_id | bigint | YES | | classes(id) | | クラスID |
| position_id | bigint | YES | | positions(id) | | 役職ID |
| is_active | boolean | YES | | | true | アクティブフラグ |
| notes | text | YES | | | | 備考 |
| created_at | timestamptz | YES | | | now() | 作成日時 |
| updated_at | timestamptz | YES | | | now() | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (profile_id)
- INDEX (class_id)
- INDEX (position_id)

#### 3.2.5 libraries（図書室）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | 図書室ID |
| name | text | NO | | | | 図書室名 |
| location | text | YES | | | | 場所 |
| capacity | integer | YES | | | 1 | 必要人数 |
| is_active | boolean | YES | | | true | アクティブフラグ |
| notes | text | YES | | | | 備考 |
| created_at | timestamptz | YES | | | now() | 作成日時 |
| updated_at | timestamptz | YES | | | now() | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE (name)

#### 3.2.6 library_availability（図書室利用可能時間）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | ID |
| library_id | bigint | NO | | libraries(id) | | 図書室ID |
| day_of_week | integer | NO | | | | 曜日（0:日〜6:土） |
| start_time | time | NO | | | | 開始時間 |
| end_time | time | NO | | | | 終了時間 |
| created_at | timestamptz | YES | | | now() | 作成日時 |
| updated_at | timestamptz | YES | | | now() | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (library_id)
- UNIQUE (library_id, day_of_week, start_time)

### 3.3 スケジュール関連テーブル

#### 3.3.1 schedule_rules（スケジュールルール）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | ルールID |
| name | text | NO | | | | ルール名 |
| description | text | YES | | | | 説明 |
| rule_type | text | NO | | | | ルールタイプ（required/preferred/forbidden） |
| priority | integer | YES | | | 0 | 優先度 |
| parameters | jsonb | YES | | | | パラメータ（JSONフォーマット） |
| created_at | timestamptz | YES | | | now() | 作成日時 |

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE (name)

#### 3.3.2 schedules（スケジュール）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | スケジュールID |
| name | text | NO | | | | スケジュール名 |
| description | text | YES | | | | 説明 |
| start_date | date | NO | | | | 開始日 |
| end_date | date | NO | | | | 終了日 |
| is_published | boolean | YES | | | false | 公開フラグ |
| created_by | uuid | YES | | profiles(id) | | 作成者ID |
| created_at | timestamptz | YES | | | now() | 作成日時 |
| updated_at | timestamptz | YES | | | now() | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (created_by)
- INDEX (start_date, end_date)

#### 3.3.3 schedule_assignments（スケジュール割り当て）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | 割り当てID |
| schedule_id | bigint | NO | | schedules(id) | | スケジュールID |
| library_id | bigint | NO | | libraries(id) | | 図書室ID |
| date | date | NO | | | | 日付 |
| committee_member_id | bigint | NO | | committee_members(id) | | 図書委員ID |
| created_at | timestamptz | YES | | | now() | 作成日時 |
| updated_at | timestamptz | YES | | | now() | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (schedule_id)
- INDEX (library_id)
- INDEX (committee_member_id)
- INDEX (date)
- UNIQUE (schedule_id, library_id, date, committee_member_id)

#### 3.3.4 schedule_exemptions（スケジュール除外日）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | 除外ID |
| committee_member_id | bigint | NO | | committee_members(id) | | 図書委員ID |
| date | date | NO | | | | 日付 |
| reason | text | YES | | | | 理由 |
| created_at | timestamptz | YES | | | now() | 作成日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (committee_member_id)
- INDEX (date)
- UNIQUE (committee_member_id, date)

#### 3.3.5 schedule_change_logs（スケジュール変更履歴）

| カラム名 | データ型 | NULL | 主キー | 外部キー | デフォルト | 説明 |
|---------|---------|------|-------|---------|-----------|------|
| id | bigint | NO | YES | | identity | 変更履歴ID |
| schedule_id | bigint | NO | | schedules(id) | | スケジュールID |
| assignment_id | bigint | YES | | schedule_assignments(id) | | 割り当てID |
| changed_by | uuid | YES | | profiles(id) | | 変更者ID |
| change_type | text | NO | | | | 変更タイプ（create/update/delete） |
| old_values | jsonb | YES | | | | 変更前の値 |
| new_values | jsonb | YES | | | | 変更後の値 |
| reason | text | YES | | | | 変更理由 |
| created_at | timestamptz | YES | | | now() | 作成日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX (schedule_id)
- INDEX (assignment_id)
- INDEX (changed_by)
- INDEX (created_at)

## 4. DB関数・ストアドプロシージャ

### 4.1 スケジュール生成関数

```sql
CREATE OR REPLACE FUNCTION public.generate_schedule(
  p_name text,
  p_description text,
  p_start_date date,
  p_end_date date,
  p_committee_member_ids bigint[]
) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE
  v_schedule_id bigint;
  v_date date;
  v_day_of_week integer;
  v_available_libraries bigint[];
  v_available_members bigint[];
  v_member_assignment_count map<bigint, integer>;
  v_library_id bigint;
  v_member_id bigint;
BEGIN
  -- スケジュール作成
  INSERT INTO public.schedules (name, description, start_date, end_date)
  VALUES (p_name, p_description, p_start_date, p_end_date)
  RETURNING id INTO v_schedule_id;
  
  -- 割り当てカウンター初期化
  FOR v_member_id IN SELECT unnest(p_committee_member_ids) LOOP
    v_member_assignment_count[v_member_id] := 0;
  END LOOP;
  
  -- 日付ループ
  v_date := p_start_date;
  WHILE v_date <= p_end_date LOOP
    -- 曜日取得
    v_day_of_week := EXTRACT(DOW FROM v_date);
    
    -- 利用可能図書室取得
    SELECT array_agg(library_id) INTO v_available_libraries
    FROM public.library_availability
    WHERE day_of_week = v_day_of_week;
    
    -- 図書室がある場合のみ処理
    IF array_length(v_available_libraries, 1) > 0 THEN
      -- 利用可能図書委員取得（除外日でない図書委員）
      SELECT array_agg(cm.id) INTO v_available_members
      FROM unnest(p_committee_member_ids) AS member_id
      JOIN public.committee_members cm ON cm.id = member_id
      LEFT JOIN public.schedule_exemptions se 
        ON se.committee_member_id = cm.id AND se.date = v_date
      WHERE se.id IS NULL;
      
      -- 図書室ごとに割り当て
      FOREACH v_library_id IN ARRAY v_available_libraries LOOP
        -- 人数の少ない委員から割り当て
        SELECT member_id INTO v_member_id
        FROM (
          SELECT unnest(v_available_members) AS member_id
        ) AS m
        ORDER BY v_member_assignment_count[member_id] ASC, random()
        LIMIT 1;
        
        -- 割り当て登録
        IF v_member_id IS NOT NULL THEN
          INSERT INTO public.schedule_assignments 
            (schedule_id, library_id, date, committee_member_id)
          VALUES 
            (v_schedule_id, v_library_id, v_date, v_member_id);
          
          -- カウンター更新
          v_member_assignment_count[v_member_id] := 
            v_member_assignment_count[v_member_id] + 1;
          
          -- 利用可能メンバーから削除
          v_available_members := 
            array_remove(v_available_members, v_member_id);
        END IF;
      END LOOP;
    END IF;
    
    -- 次の日へ
    v_date := v_date + interval '1 day';
  END LOOP;
  
  RETURN v_schedule_id;
END;
$$;
```

### 4.2 スケジュール検証関数

```sql
CREATE OR REPLACE FUNCTION public.validate_schedule(
  p_schedule_id bigint
) RETURNS TABLE(
  rule_name text,
  description text,
  is_violated boolean,
  details jsonb
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH schedule_data AS (
    SELECT 
      s.id, s.start_date, s.end_date,
      array_agg(DISTINCT sa.committee_member_id) AS member_ids
    FROM public.schedules s
    JOIN public.schedule_assignments sa ON sa.schedule_id = s.id
    WHERE s.id = p_schedule_id
    GROUP BY s.id
  ),
  
  assignment_counts AS (
    SELECT 
      sa.committee_member_id,
      count(*) AS assignment_count
    FROM public.schedule_assignments sa
    WHERE sa.schedule_id = p_schedule_id
    GROUP BY sa.committee_member_id
  ),
  
  max_min_counts AS (
    SELECT 
      max(ac.assignment_count) AS max_count,
      min(ac.assignment_count) AS min_count
    FROM assignment_counts ac
  ),
  
  same_day_assignments AS (
    SELECT 
      sa.committee_member_id,
      sa.date,
      count(*) AS daily_count
    FROM public.schedule_assignments sa
    WHERE sa.schedule_id = p_schedule_id
    GROUP BY sa.committee_member_id, sa.date
    HAVING count(*) > 1
  ),
  
  consecutive_days AS (
    SELECT 
      sa.committee_member_id,
      sa.date,
      lead(sa.date) OVER (
        PARTITION BY sa.committee_member_id 
        ORDER BY sa.date
      ) AS next_date
    FROM public.schedule_assignments sa
    WHERE sa.schedule_id = p_schedule_id
  ),
  
  consecutive_violations AS (
    SELECT DISTINCT
      cd.committee_member_id,
      cd.date
    FROM consecutive_days cd
    WHERE cd.next_date = cd.date + interval '1 day'
  )
  
  -- ルール1: 同日複数当番禁止
  SELECT
    '同日複数当番禁止' AS rule_name,
    '図書委員は同じ日に複数の当番を割り当てられるべきではない' AS description,
    count(*) > 0 AS is_violated,
    jsonb_build_object(
      'violations', jsonb_agg(
        jsonb_build_object(
          'committee_member_id', sda.committee_member_id,
          'date', sda.date,
          'count', sda.daily_count
        )
      )
    ) AS details
  FROM same_day_assignments sda
  
  UNION ALL
  
  -- ルール2: 連続日当番禁止
  SELECT
    '連続日当番禁止' AS rule_name,
    '図書委員は連続した日に当番を割り当てられるべきではない' AS description,
    count(*) > 0 AS is_violated,
    jsonb_build_object(
      'violations', jsonb_agg(
        jsonb_build_object(
          'committee_member_id', cv.committee_member_id,
          'date', cv.date,
          'next_date', cv.date + interval '1 day'
        )
      )
    ) AS details
  FROM consecutive_violations cv
  
  UNION ALL
  
  -- ルール3: 公平な割り当て
  SELECT
    '公平な割り当て' AS rule_name,
    '全ての図書委員は同程度の回数当番に割り当てられるべき' AS description,
    mmc.max_count - mmc.min_count > 1 AS is_violated,
    jsonb_build_object(
      'max_count', mmc.max_count,
      'min_count', mmc.min_count,
      'diff', mmc.max_count - mmc.min_count,
      'assignments', jsonb_agg(
        jsonb_build_object(
          'committee_member_id', ac.committee_member_id,
          'count', ac.assignment_count
        )
      )
    ) AS details
  FROM max_min_counts mmc, assignment_counts ac;
END;
$$;
```

## 5. データアクセス制御

### 5.1 RLSポリシー

#### 5.1.1 profiles テーブル

```sql
-- 自分のプロフィールは読み書き可能
CREATE POLICY "ユーザーは自分のプロフィールを閲覧可能"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "ユーザーは自分のプロフィールを更新可能"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 管理者は全プロフィールを読み書き可能
CREATE POLICY "管理者は全プロフィールを閲覧可能"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
```

#### 5.1.2 committee_members テーブル

```sql
-- 全ユーザーが図書委員一覧を閲覧可能
CREATE POLICY "全ユーザーが図書委員一覧を閲覧可能"
ON public.committee_members FOR SELECT
TO authenticated
USING (true);

-- 自分のプロフィールに紐づく図書委員情報は更新可能
CREATE POLICY "ユーザーは自分の図書委員情報を更新可能"
ON public.committee_members FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());

-- 管理者は全図書委員情報を更新可能
CREATE POLICY "管理者は全図書委員情報を管理可能"
ON public.committee_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
```

#### 5.1.3 schedules テーブル

```sql
-- 全ユーザーが公開スケジュールを閲覧可能
CREATE POLICY "全ユーザーが公開スケジュールを閲覧可能"
ON public.schedules FOR SELECT
TO authenticated
USING (is_published = true);

-- 管理者は全スケジュールを管理可能
CREATE POLICY "管理者は全スケジュールを管理可能"
ON public.schedules FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
```

#### 5.1.4 schedule_assignments テーブル

```sql
-- 全ユーザーが公開スケジュールの割り当てを閲覧可能
CREATE POLICY "全ユーザーが公開スケジュールの割り当てを閲覧可能"
ON public.schedule_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.schedules s
    WHERE s.id = schedule_id AND s.is_published = true
  )
);

-- 自分の割り当てを閲覧可能
CREATE POLICY "ユーザーは自分の割り当てを閲覧可能"
ON public.schedule_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.committee_members cm
    WHERE cm.id = committee_member_id AND cm.profile_id = auth.uid()
  )
);

-- 管理者は全割り当てを管理可能
CREATE POLICY "管理者は全割り当てを管理可能"
ON public.schedule_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
```

## 6. 初期データ

### 6.1 ロール初期データ

```sql
INSERT INTO public.roles (name, description)
VALUES
  ('admin', '管理者'),
  ('teacher', '教員'),
  ('committee_head', '委員長'),
  ('committee_member', '図書委員');
```

### 6.2 役職初期データ

```sql
INSERT INTO public.positions (name, description)
VALUES
  ('委員長', '図書委員会の委員長'),
  ('副委員長', '図書委員会の副委員長'),
  ('一般委員', '図書委員会の一般委員');
```

## 7. バックアップ・リストア戦略

### 7.1 バックアップ手法

- **定期バックアップ**: Supabaseによる日次自動バックアップ
- **手動バックアップ**: 重要な更新前に手動でバックアップを実施

### 7.2 リストア手順

1. Supabase管理コンソールからリストアポイントを選択
2. データベースのリストアを実行
3. アプリケーションの動作検証を実施

## 8. マイグレーション戦略

- **開発環境**: 変更ごとにマイグレーションファイルを作成
- **本番環境**: 計画的なマイグレーション実施と事前テスト
- **ロールバック手順**: 各マイグレーションにロールバック処理を定義

## 9. パフォーマンス最適化

### 9.1 インデックス最適化

- 適切なインデックス設計によるクエリパフォーマンス向上
- 複合インデックスによる検索の高速化
- インデックス使用状況の定期的な監視と調整

### 9.2 クエリ最適化

- 効率的なクエリ設計によるレスポンス時間の短縮
- 必要最小限のデータ取得による転送量削減
- 適切なJOIN方法の選択によるパフォーマンス向上

## 10. まとめ

本設計書では、図書委員当番割り当てシステムの第一フェーズにおけるデータベース設計の詳細を記述しました。テーブル構造、リレーションシップ、インデックス、ストアドプロシージャ、セキュリティポリシーなどを定義しています。

この設計に基づいてデータベースを構築することで、システム要件を満たす堅牢なデータ基盤を実現します。また、将来の拡張性も考慮した設計となっています。
