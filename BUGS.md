# Confirmed Bugs

## P0 — Forged Access Tokens Grant Access

**Affected:** HOD, Faculty, Student, University

`requireAuth` accepts tokens in the form `ROLE:userId` without verifying a
signature or validating Faculty/HOD records. A caller who knows an ID can
construct an access token. Faculty and HOD tokens are accepted without any
database lookup.

**Fix:** Use signed, expiring tokens and load the account record before
authorizing a request.

## P0 — HOD and Faculty Login Tabs Do Not Enforce Their Roles

**Affected:** HOD, Faculty

The selected HOD or Faculty tab is ignored during login. A non-HOD who selects
HOD is logged in as Faculty; an HOD who selects Faculty is logged in as HOD.

**Fix:** Reject an HOD login unless `faculty.isHod` is true, and reject a
Faculty login when `faculty.isHod` is true (or remove the separate tabs).

## P1 — Any Logged-In User Can Open Any Portal Route

**Affected:** HOD, Faculty, Student, University

The frontend route guard checks only whether an access token exists. A Student
can open `/hod`, `/faculty`, or `/university`; backend requests then fail but
the wrong portal UI renders.

**Fix:** Add route-level role checks and redirect users to their own portal.

## P1 — Sessions Do Not Expire or Respect Deactivation

**Affected:** HOD, Faculty, Student, University

Refresh-token `expiresAt` is never checked. Existing access and refresh tokens
also remain usable after an account is deactivated because auth middleware does
not validate `isActive`.

**Fix:** Reject expired refresh tokens, verify account activity on every token
validation, and revoke sessions when an account is disabled.

## P1 — Faculty Password Change Always Fails

**Affected:** Faculty

The frontend sends `currentPassword` and `newPassword`, but the backend also
requires `confirmPassword`. The backend therefore compares the new password to
`undefined` and rejects every request.

**Fix:** Send `confirmPassword` from the Faculty settings form, or remove the
redundant backend confirmation check after client validation.

## P2 — Staff Initial Passwords Are Not Enforced

**Affected:** HOD, Faculty, University

Only Student login returns `isFirstLogin`. HOD, Faculty, and University users
are never redirected to change an initial password.

**Fix:** Return and enforce the same first-login flag for all account types.

## P2 — Remember Me Does Nothing

**Affected:** HOD, Faculty, Student, University

The checkbox changes local state only. Authentication tokens are persisted for
every login regardless of its value.

**Fix:** Persist credentials only when checked; otherwise keep them in memory
for the browser session.

## P2 — Forgot Password Is Not Implemented

**Affected:** HOD, Faculty, Student, University

The UI displays a toast and the API returns a generic success response without
creating or sending a reset flow.

**Fix:** Implement reset-token creation and delivery, or replace the control
with the documented administrator-support process.
