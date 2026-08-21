# Skill Tests

Tests for skills in this repo. Each test is a subagent scenario run via the Task tool.

## How to Run

For each scenario in a test file:

1. Dispatch a subagent with the scenario prompt (via Task tool)
2. Include the skill content in the system context if testing WITH the skill
3. Check the subagent's response against the success criteria

## Test Files

| File                                         | Skill Tested       |
| -------------------------------------------- | ------------------ |
| [migrate-sendgrid.md](./migrate-sendgrid.md) | `migrate-sendgrid` |

## Success Rate

A skill passes when all scenarios meet their success criteria.
A skill needs revision when any scenario fails.
