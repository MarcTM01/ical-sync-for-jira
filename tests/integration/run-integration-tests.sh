#!/usr/bin/env bash
set -euxo pipefail

function wait_for_service_availability {
  attempt_counter=0
  max_attempts=15

  until curl --silent 127.0.0.1:8080 | grep -q 'Not Found'; do
    if [ ${attempt_counter} -eq ${max_attempts} ];then
      echo "Max attempts reached"
      exit 1
    fi
    attempt_counter=$((attempt_counter+1))
    sleep 1
  done
}

function test_calendar_can_be_retrieved {
  curl --fail --silent http://127.0.0.1:8080/calendars/my-calendar/ical\?accessToken\=test-token \
    | grep -q "SUMMARY:TP-1 Testing-Task 1 Deadline"
}

wait_for_service_availability
test_calendar_can_be_retrieved

echo "All done! The tests seem to pass just fine"
