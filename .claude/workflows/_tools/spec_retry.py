#!/usr/bin/env python3
"""spec_retry.py — 단계 재게이트 실패 재시도 카운터(feature 스코프).

Workflow 스크립트는 매 호출이 stateless이므로, "같은 레벨이 3회 넘게 반복 실패하면
Human Gate로 전환"을 판단하려면 재시도 횟수를 파일에 지속시켜야 한다. 이 도구가 그 카운터다.

usage:
  spec_retry.py bump  --feature {f} --stage {brief|design|facts|prd|plan|tc}   # 실패 시 +1
  spec_retry.py reset --feature {f} --stage {brief|design|facts|prd|plan|tc}   # 성공 시 0으로 리셋
  spec_retry.py get   --feature {f} --stage {brief|design|facts|prd|plan|tc}   # 현재 값 조회
"""
import argparse
import json
import os

SPECS = os.environ.get("SPECS_BASE") or (lambda r: os.path.join(r, "specs") if os.path.basename(r) == ".claude" else os.path.join(r, ".claude", "specs"))(
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
)


def path(feature):
    return os.path.join(SPECS, "_data", "manifests", f"spec_retry_{feature}.json")


def load(feature):
    p = path(feature)
    if os.path.exists(p):
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save(feature, data):
    p = path(feature)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["bump", "reset", "get"])
    ap.add_argument("--feature", required=True)
    ap.add_argument("--stage", required=True, choices=["brief", "design", "facts", "prd", "plan", "tc"])
    a = ap.parse_args()

    data = load(a.feature)
    if a.action == "bump":
        data[a.stage] = data.get(a.stage, 0) + 1
        save(a.feature, data)
    elif a.action == "reset":
        data[a.stage] = 0
        save(a.feature, data)

    print(json.dumps({"stage": a.stage, "count": data.get(a.stage, 0)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
