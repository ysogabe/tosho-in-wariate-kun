#!/bin/bash
# すべてのテスト環境を停止

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Searching for running test environments..."

found=0
for pid_file in .test-env-*.pid; do
    if [ -f "$pid_file" ]; then
        found=1
        issue_number=$(echo $pid_file | sed 's/.test-env-\(.*\).pid/\1/')
        echo "Found test environment for Issue #${issue_number}"
        "$SCRIPT_DIR/test-env.sh" $issue_number stop
        echo ""
    fi
done

if [ $found -eq 0 ]; then
    echo "No running test environments found"
else
    echo "All test environments stopped"
fi