-- Callable PL/SQL wrapper — this is what APEX validations hit
CREATE OR REPLACE FUNCTION js_process_leave(p_payload IN VARCHAR2)
  RETURN VARCHAR2
  AS MLE MODULE leave_engine_module
  SIGNATURE 'processLeaveRequest(string)';
/

-- Quick smoke test — should return a JSON string
SELECT js_process_leave(
  '{"monthsWorked":12,"daysTaken":5,"leaveType":"annual",
    "requestedDays":3,"noticeDays":5}'
) AS result
FROM dual;
