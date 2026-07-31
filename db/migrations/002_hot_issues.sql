-- TASK-BE-5/6/7: 핫이슈 자동 수집·목록 조회·상세 조회를 위한 영속 저장소
-- 삭제 로직 없이 무기한 누적 보관 (배치가 INSERT만 수행, DELETE 없음)
CREATE TABLE IF NOT EXISTS hot_issues (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  original_url TEXT NOT NULL UNIQUE,
  summary TEXT,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TASK-BE-6: 목록 기본 정렬(수집 시각 최신순) 최적화
CREATE INDEX IF NOT EXISTS idx_hot_issues_collected_at ON hot_issues (collected_at DESC);

-- TASK-BE-6: 출처 필터 탭 최적화
CREATE INDEX IF NOT EXISTS idx_hot_issues_source ON hot_issues (source);
