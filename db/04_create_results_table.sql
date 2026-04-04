CREATE TABLE mle_test_results (
  id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id        VARCHAR2(100)  NOT NULL,
  suite_name    VARCHAR2(200)  NOT NULL,
  test_name     VARCHAR2(500)  NOT NULL,
  status        VARCHAR2(10)   NOT NULL
                CHECK (status IN ('PASS','FAIL','SKIP')),
  duration_ms   NUMBER,
  error_message VARCHAR2(4000),
  run_at        TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_mtr_run_id ON mle_test_results(run_id);
CREATE INDEX idx_mtr_status ON mle_test_results(status);