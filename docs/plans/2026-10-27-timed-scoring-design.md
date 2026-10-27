# Timed scoring and visible points

Applies to choice, higher-lower and odd-one-out across Daily, offline practice and multiplayer. Other formats keep their scoring rules.

Approved direction: 1,000 points through 5 seconds, linear decay to a 500-point floor at 15 seconds, hold until a 30-second deadline. Wrong answers and timeouts score zero. The horizontal bar represents available total points and stops at 50%; a separate countdown continues. Display the grace period explicitly. At timeout, lock the answer and enter the existing reveal/waiting flow.

Implementation: centralize constants and the points curve in lib/utils.ts; reuse SpeedBonusMeter in shared inputs and live pages, with timeout callbacks through existing answer submission. Keep ticking state inside the meter. Validate scoring boundaries, timer cleanup/reset and timeout once, run typecheck/tests, and inspect narrow/wide renders.
