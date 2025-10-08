#!/bin/bash

# 各バッチファイルを順番に読み込んで内容を表示（実際の実行はMCPで行う）
for i in {2..10}; do
    echo "=== バッチ $i ==="
    echo "ファイル: sql-batches/batch-$i.sql"
    echo "実行準備完了"
    echo ""
done