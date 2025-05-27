#!/bin/bash
# 開発環境起動スクリプト

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# バックエンド起動
echo "Starting backend server..."
cd mock_backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# 少し待機（バックエンドの起動を待つ）
sleep 2

# フロントエンド起動
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================="
echo "Development environment started"
echo "========================================="
echo "Backend PID: $BACKEND_PID (http://localhost:5200)"
echo "Frontend PID: $FRONTEND_PID (http://localhost:3200)"
echo "========================================="
echo "Press Ctrl+C to stop"
echo ""

# 終了時の処理
cleanup() {
    echo ""
    echo "Stopping development environment..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "Development environment stopped"
}

trap cleanup EXIT

# プロセスが終了するまで待機
wait $BACKEND_PID $FRONTEND_PID