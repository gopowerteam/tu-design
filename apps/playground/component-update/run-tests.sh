#!/usr/bin/env bash
# 组件更新链路端到端测试：真实 CLI（packages/cli/dist）+ 本地假 registry + stub 包管理器。
# 覆盖：首次安装、幂等重装、lockfile、diff 全状态（最新/可更新/本地已改/冲突/缺失/未跟踪）、
#       非 TTY 覆盖安全语义（无 --overwrite 退出码 1）、--dry-run 纯预览、legacy 降级、
#       registry 版本升级、获取失败隔离、lockfile 损坏报错、多组件拓扑安装。
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
CLI="$REPO/packages/cli/dist/index.mjs"
REG_DIR="$HERE/mock-registry"
PROJ="$HERE/fake-project"
LEGACY="$HERE/fake-project-legacy"
PORT=41730
STUB_LOG="$HERE/bin/stub-pnpm.log"
OUT="$HERE/.out.log"
SERVER_PID=""
PASS=0
FAIL=0

# ---------- 断言工具 ----------
say()  { printf '%s\n' "$*"; }
ok()   { PASS=$((PASS + 1)); say "    ✔ $1"; }
bad()  { FAIL=$((FAIL + 1)); say "    ✖ $1"; }
assert_rc()           { if [ "$2" -eq "$3" ]; then ok "$1"; else bad "$1（rc=$2，期望 $3）"; fi; }
assert_rc_ne()        { if [ "$2" -ne "$3" ]; then ok "$1"; else bad "$1（rc=$2，期望非 $3）"; fi; }
assert_contains()     { if grep -qF -- "$3" "$2" 2>/dev/null; then ok "$1"; else bad "$1（未找到：$3）"; fi; }
assert_not_contains() { if grep -qF -- "$3" "$2" 2>/dev/null; then bad "$1（不应出现：$3）"; else ok "$1"; fi; }
assert_file()         { if [ -f "$2" ]; then ok "$1"; else bad "$1（缺文件：$2）"; fi; }
assert_no_file()      { if [ ! -e "$2" ]; then ok "$1"; else bad "$1（不应存在：$2）"; fi; }
assert_json()         { local v; v="$(node -e 'try{const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const p=process.argv[2].split(".");let x=j;for(const k of p){x=x?.[k]}console.log(x===undefined||x===null?"__nil__":x)}catch{console.log("__err__")}' "$2" "$3")"; if [ "$v" = "$4" ]; then ok "$1"; else bad "$1（$3 = $v，期望 $4）"; fi; }

lockfile_hash() {
  node -e 'const c=require("crypto"),f=require("fs");try{console.log(c.createHash("sha256").update(f.readFileSync(process.argv[1],"utf8")).digest("hex"))}catch{console.log("none")}' "$PROJ/components.lock.json"
}

# ---------- 环境准备 ----------
reset_env() {
  rm -rf "$REG_DIR" "$PROJ" "$LEGACY" "$OUT"
  mkdir -p "$REG_DIR" "$PROJ/src" "$LEGACY/src"
  cp "$REPO"/packages/vue/registry/vue/*.json "$REG_DIR"/
  for proj in "$PROJ" "$LEGACY"; do
    cat > "$proj/package.json" <<'EOF'
{ "name": "fake-project", "private": true, "packageManager": "pnpm@12.6.0" }
EOF
    cat > "$proj/components.json" <<EOF
{
  "framework": "vue",
  "registry": "http://127.0.0.1:$PORT",
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib" },
  "tailwind": { "css": "src/assets/main.css" }
}
EOF
  done
  : > "$STUB_LOG"
  chmod +x "$HERE/bin/pnpm"
}

start_server() {
  node "$HERE/serve-registry.mjs" "$REG_DIR" "$PORT" >"$HERE/.server.log" 2>&1 &
  SERVER_PID=$!
  sleep 0.6
}
stop_server() { [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null; }

# bump_registry <新版本> <内容标记>：升级 mock registry 的 button（模拟一次线上发布）
bump_registry() {
  node -e '
    const fs = require("fs");
    const [p, v, marker] = process.argv.slice(1);
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    j.version = v;
    for (const f of j.files) {
      if (f.path === "button/Button.vue") f.content += "\n<!-- " + marker + " -->\n";
    }
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  ' "$REG_DIR/button.json" "$1" "$2"
}

cli()    { (cd "$PROJ"   && PATH="$HERE/bin:$PATH" STUB_PNPM_LOG="$STUB_LOG" node "$CLI" "$@"); }
cli_leg(){ (cd "$LEGACY" && PATH="$HERE/bin:$PATH" STUB_PNPM_LOG="$STUB_LOG" node "$CLI" "$@"); }
run()    { cli "$@" >"$OUT" 2>&1; RC=$?; }
run_leg(){ cli_leg "$@" >"$OUT" 2>&1; RC=$?; }

# ============================================================
reset_env
start_server
trap stop_server EXIT

say "▸ T1 首次安装 --dry-run（纯预览，不落盘）"
run add button --dry-run
assert_rc       "退出码 0"                       "$RC" 0
assert_contains "输出 dry-run 提示"              "$OUT" "dry-run：未写入任何文件"
assert_contains "输出 将写入 清单"               "$OUT" "将写入"
assert_no_file  "未创建组件目录"                 "$PROJ/src/components/ui/button"
assert_no_file  "未创建 lockfile"                "$PROJ/components.lock.json"

say "▸ T2 首次安装 add（写入 + 拓扑依赖 + lockfile + stub 安装依赖）"
run add button
assert_rc       "退出码 0"                       "$RC" 0
assert_file     "Button.vue 写入"                "$PROJ/src/components/ui/button/Button.vue"
assert_file     "button/index.ts 写入"           "$PROJ/src/components/ui/button/index.ts"
assert_file     "registryDependency utils 写入"  "$PROJ/src/lib/utils.ts"
assert_file     "registryDependency slot 写入"   "$PROJ/src/components/ui/slot/Slot.ts"
assert_file     "lockfile 创建"                  "$PROJ/components.lock.json"
assert_json     "lockfile 记录 button 版本"      "$PROJ/components.lock.json" "packages.button.version" "0.4.1"
assert_json     "lockfile 记录 utils 版本"       "$PROJ/components.lock.json" "packages.utils.version"  "0.4.1"
assert_json     "lockfile 记录 slot 版本"        "$PROJ/components.lock.json" "packages.slot.version"   "0.4.1"
assert_contains "stub pnpm 安装了 cva 依赖"      "$STUB_LOG" "class-variance-authority@^0.7.1"

say "▸ T3 重复安装（幂等：内容相同静默跳过，lockfile 不变）"
L0="$(lockfile_hash)"
run add button
assert_rc       "退出码 0"                       "$RC" 0
assert_contains "输出 已是最新（跳过）"          "$OUT" "已是最新（跳过）"
assert_contains "输出 没有写入任何文件"          "$OUT" "没有写入任何文件"
if [ "$(lockfile_hash)" = "$L0" ]; then ok "lockfile 未变化"; else bad "lockfile 未变化"; fi

say "▸ T4 全新状态 diff（全部 最新）"
run diff
assert_rc        "退出码 0"                     "$RC" 0
assert_contains  "输出 最新 状态"               "$OUT" "最新"
assert_not_contains "无可更新"                  "$OUT" "可更新"
assert_not_contains "无冲突"                    "$OUT" "冲突"
assert_not_contains "无缺失"                    "$OUT" "缺失"

say "▸ T5 本地改动 + 非 TTY 覆盖安全语义"
echo "<!-- local-edit -->" >> "$PROJ/src/components/ui/button/Button.vue"
L1="$(lockfile_hash)"
run diff button
assert_rc       "diff 退出码 0"                  "$RC" 0
assert_contains "diff 标记 本地已改"             "$OUT" "本地已改"
run add button
assert_rc_ne    "非 TTY 无 --overwrite 退出码非 0" "$RC" 0
assert_contains "警告：本地有改动且未覆盖"       "$OUT" "本地有改动且未覆盖"
assert_contains "本地改动保留（未被覆盖）"       "$PROJ/src/components/ui/button/Button.vue" "local-edit"
if [ "$(lockfile_hash)" = "$L1" ]; then ok "跳过时 lockfile 未变"; else bad "跳过时 lockfile 未变"; fi
run add button --overwrite
assert_rc       "加 --overwrite 退出码 0"        "$RC" 0
assert_not_contains "本地改动被覆盖移除"         "$PROJ/src/components/ui/button/Button.vue" "local-edit"

say "▸ T6 线上发布新版本（可更新）"
bump_registry "0.5.0" "registry-v0.5.0"
run diff button
assert_rc       "diff 退出码 0"                  "$RC" 0
assert_contains "diff 标记 可更新"               "$OUT" "可更新"
assert_contains "显示线上新版本 0.5.0"           "$OUT" "0.5.0"
run add button --dry-run
assert_rc       "dry-run 退出码 0（不触发冲突退出码）" "$RC" 0
assert_contains "dry-run 输出 将覆盖"            "$OUT" "将覆盖"
assert_not_contains "dry-run 未落盘（无 0.5.0 标记）" "$PROJ/src/components/ui/button/Button.vue" "registry-v0.5.0"
run add button
assert_rc_ne    "非 TTY 无 --overwrite 退出码非 0" "$RC" 0
run add button --overwrite
assert_rc       "覆盖更新退出码 0"               "$RC" 0
assert_contains "新内容写入（0.5.0 标记）"       "$PROJ/src/components/ui/button/Button.vue" "registry-v0.5.0"
assert_json     "lockfile 版本升级到 0.5.0"      "$PROJ/components.lock.json" "packages.button.version" "0.5.0"

say "▸ T7 本地改动 + 线上也发布（冲突）"
echo "<!-- local-edit-2 -->" >> "$PROJ/src/components/ui/button/Button.vue"
bump_registry "0.6.0" "registry-v0.6.0"
run diff button
assert_rc       "diff 退出码 0"                  "$RC" 0
assert_contains "diff 标记 冲突"                 "$OUT" "冲突"
assert_contains "冲突时提示 git diff 人工比对"   "$OUT" "git diff"
run add button
assert_rc_ne    "冲突 + 非 TTY 无 --overwrite 退出码非 0" "$RC" 0
run add button --overwrite
assert_rc       "覆盖解决冲突退出码 0"           "$RC" 0
assert_contains "线上 0.6.0 内容写入"            "$PROJ/src/components/ui/button/Button.vue" "registry-v0.6.0"
assert_not_contains "本地旧改动被覆盖移除"       "$PROJ/src/components/ui/button/Button.vue" "local-edit-2"
assert_json     "lockfile 版本升级到 0.6.0"      "$PROJ/components.lock.json" "packages.button.version" "0.6.0"
run diff button
assert_not_contains "解决后无可更新"             "$OUT" "可更新"
assert_not_contains "解决后无冲突"               "$OUT" "冲突"

say "▸ T8 本地缺文件（缺失 → 覆盖补齐）"
assert_file     "前置：Slot.ts 存在"             "$PROJ/src/components/ui/slot/Slot.ts"
rm "$PROJ/src/components/ui/slot/Slot.ts"
run diff slot
assert_rc       "diff slot 退出码 0"             "$RC" 0
assert_contains "diff 标记 缺失"                 "$OUT" "缺失"
run add slot --overwrite
assert_rc       "补齐退出码 0"                   "$RC" 0
assert_file     "Slot.ts 已恢复"                 "$PROJ/src/components/ui/slot/Slot.ts"

say "▸ T9 legacy 项目（无 lockfile 降级两方对比）"
mkdir -p "$LEGACY/src/components/ui/button"
printf '%s\n' "<template><button>legacy local copy</button></template>" > "$LEGACY/src/components/ui/button/Button.vue"
run_leg diff button
assert_rc       "legacy diff 退出码 0"           "$RC" 0
assert_contains "legacy 标记"                    "$OUT" "legacy"
assert_contains "不一致(未跟踪) 状态"            "$OUT" "不一致(未跟踪)"
run_leg add button
assert_rc_ne    "legacy 非 TTY 无 --overwrite 退出码非 0" "$RC" 0
run_leg add button --overwrite
assert_rc       "legacy 覆盖安装退出码 0"        "$RC" 0
assert_file     "legacy lockfile 创建"           "$LEGACY/components.lock.json"
assert_json     "legacy lockfile 记录当前线上版本" "$LEGACY/components.lock.json" "packages.button.version" "0.6.0"
run_leg diff button
assert_contains "legacy 安装后归为 最新"         "$OUT" "最新"

say "▸ T10 不存在的组件（获取失败不中断，退出码 0）"
run diff ghost
assert_rc       "diff ghost 退出码 0"            "$RC" 0
assert_contains "列出 获取失败 原因"             "$OUT" "获取失败"

say "▸ T11 lockfile 损坏（明确报错，不静默当空）"
printf '%s\n' "{ broken" > "$PROJ/components.lock.json"
run add button
assert_rc_ne    "损坏 lockfile 退出码非 0"       "$RC" 0
assert_contains "报错点名 components.lock.json"  "$OUT" "components.lock.json"

say "▸ T12 多组件拓扑安装（无参 diff 空态与多包记录）"
rm -f "$PROJ/components.lock.json"
run add badge utils tokens
assert_rc       "多组件安装退出码 0"             "$RC" 0
assert_json     "lockfile 记录 badge"            "$PROJ/components.lock.json" "packages.badge.version"  "0.4.1"
assert_json     "lockfile 记录 utils"            "$PROJ/components.lock.json" "packages.utils.version"  "0.4.1"
assert_json     "lockfile 记录 tokens"           "$PROJ/components.lock.json" "packages.tokens.version" "0.4.1"
run diff
assert_rc       "全量 diff 退出码 0"             "$RC" 0
assert_not_contains "全量 diff 无异常状态"       "$OUT" "可更新"

stop_server
say ""
if [ "$FAIL" -eq 0 ]; then
  say "全部通过：$PASS 项断言 ✔"
else
  say "失败：$FAIL 项断言 ✖（通过 $PASS 项）"
fi
exit "$FAIL"
