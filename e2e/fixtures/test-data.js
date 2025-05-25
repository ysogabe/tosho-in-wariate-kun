// Test fixture data for E2E tests

/**
 * サンプル図書委員データ
 */
export const sampleLibrarians = [
  {
    student_id: 'S001',
    name: '田中太郎',
    class: '1A',
    library_room: '第一図書室'
  },
  {
    student_id: 'S002', 
    name: '佐藤花子',
    class: '1A',
    library_room: '第二図書室'
  },
  {
    student_id: 'S003',
    name: '山田次郎',
    class: '2B', 
    library_room: '第一図書室'
  }
];

/**
 * サンプルクラスデータ
 */
export const sampleClasses = [
  {
    class_id: 'C001',
    class_name: '1A',
    homeroom_teacher: '鈴木先生'
  },
  {
    class_id: 'C002',
    class_name: '1B', 
    homeroom_teacher: '高橋先生'
  },
  {
    class_id: 'C003',
    class_name: '2A',
    homeroom_teacher: '伊藤先生'
  }
];

/**
 * サンプル図書室データ
 */
export const sampleLibraryRooms = [
  {
    room_id: 'R001',
    room_name: '第一図書室',
    capacity: 2,
    description: 'メイン図書室'
  },
  {
    room_id: 'R002', 
    room_name: '第二図書室',
    capacity: 1,
    description: 'サブ図書室'
  }
];

/**
 * サンプルスケジュールデータ
 */
export const sampleSchedule = {
  schedule_name: 'テスト用スケジュール',
  description: 'E2Eテスト用のサンプルスケジュール',
  start_date: '2025-06-01',
  end_date: '2025-06-07'
};
