#!/bin/bash
# テスト環境起動スクリプト
# Usage: ./test-env.sh <issue_number> [start|stop]

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

ISSUE_NUMBER=$1
ACTION=${2:-start}

if [ -z "$ISSUE_NUMBER" ]; then
    echo "Usage: $0 <issue_number> [start|stop]"
    echo "Example: $0 15 start"
    exit 1
fi

# Issue番号が数値かチェック
if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
    echo "Error: Issue number must be a positive integer"
    exit 1
fi

FRONTEND_PORT=$((3000 + ISSUE_NUMBER))
BACKEND_PORT=$((5000 + ISSUE_NUMBER))
PID_FILE="$PROJECT_ROOT/.test-env-${ISSUE_NUMBER}.pid"

start_env() {
    # 既に起動している場合はエラー
    if [ -f "$PID_FILE" ]; then
        echo "Error: Test environment for Issue #${ISSUE_NUMBER} is already running"
        echo "Use '$0 $ISSUE_NUMBER stop' to stop it first"
        exit 1
    fi
    
    echo "Starting test environment for Issue #${ISSUE_NUMBER}"
    
    # バックエンド起動
    echo "Starting backend on port ${BACKEND_PORT}..."
    cd mock_backend
    source venv/bin/activate
    FLASK_RUN_PORT=$BACKEND_PORT python app.py > "../logs/backend-${ISSUE_NUMBER}.log" 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # 少し待機（バックエンドの起動を待つ）
    sleep 2
    
    # フロントエンド起動（環境変数でAPI URLを設定）
    echo "Starting frontend on port ${FRONTEND_PORT}..."
    cd frontend
    NEXT_PUBLIC_API_BASE_URL="http://localhost:${BACKEND_PORT}/api" \
    PORT=$FRONTEND_PORT npm run dev > "../logs/frontend-${ISSUE_NUMBER}.log" 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # PIDを保存
    echo "$BACKEND_PID $FRONTEND_PID" > "$PID_FILE"
    
    echo ""
    echo "========================================="
    echo "Test environment started for Issue #${ISSUE_NUMBER}"
    echo "========================================="
    echo "Backend: http://localhost:${BACKEND_PORT}"
    echo "Frontend: http://localhost:${FRONTEND_PORT}"
    echo "API URL: http://localhost:${BACKEND_PORT}/api"
    echo "========================================="
    echo "Logs:"
    echo "  Backend: logs/backend-${ISSUE_NUMBER}.log"
    echo "  Frontend: logs/frontend-${ISSUE_NUMBER}.log"
    echo "========================================="
    echo "To stop: $0 $ISSUE_NUMBER stop"
    echo ""
}

stop_env() {
    if [ -f "$PID_FILE" ]; then
        echo "Stopping test environment for Issue #${ISSUE_NUMBER}"
        read BACKEND_PID FRONTEND_PID < "$PID_FILE"
        
        # プロセスを終了
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            echo "Backend stopped (PID: $BACKEND_PID)"
        else
            echo "Backend was not running (PID: $BACKEND_PID)"
        fi
        
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            echo "Frontend stopped (PID: $FRONTEND_PID)"
        else
            echo "Frontend was not running (PID: $FRONTEND_PID)"
        fi
        
        rm "$PID_FILE"
        echo "Test environment stopped for Issue #${ISSUE_NUMBER}"
    else
        echo "No running test environment found for Issue #${ISSUE_NUMBER}"
    fi
}

# logsディレクトリを作成
mkdir -p "$PROJECT_ROOT/logs"

case $ACTION in
    start)
        start_env
        ;;
    stop)
        stop_env
        ;;
    restart)
        stop_env
        sleep 2
        start_env
        ;;
    status)
        if [ -f "$PID_FILE" ]; then
            read BACKEND_PID FRONTEND_PID < "$PID_FILE"
            echo "Test environment for Issue #${ISSUE_NUMBER} is running"
            echo "Backend PID: $BACKEND_PID (port ${BACKEND_PORT})"
            echo "Frontend PID: $FRONTEND_PID (port ${FRONTEND_PORT})"
        else
            echo "Test environment for Issue #${ISSUE_NUMBER} is not running"
        fi
        ;;
    *)
        echo "Invalid action. Use 'start', 'stop', 'restart', or 'status'"
        exit 1
        ;;
esac