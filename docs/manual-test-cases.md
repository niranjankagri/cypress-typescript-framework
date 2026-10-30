# Manual test cases

The test cases this framework automates, written as a tester would run them by hand. Every case has
an ID; the Cypress test that covers it starts with the same ID (`[TC-101] ...`), so a failure in the
report leads straight to the case below.

| ID range         | Area                          | Automated in                 |
| ---------------- | ----------------------------- | ---------------------------- |
| TC-101 to TC-133 | TaskBoard in the browser (UI) | `cypress/e2e/ui/*.cy.ts`     |
| TC-201 to TC-231 | TaskBoard REST API            | `cypress/e2e/api/*.cy.ts`    |
| TC-301 to TC-317 | React components on their own | `cypress/component/*.cy.tsx` |

Not listed: the app's own server unit tests (`app/server/*.test.ts`) and `cypress/e2e/demo/`, which
fails on purpose to show the report.

## Setup for manual runs

1. `npm ci`, `npm run build`, `npm start`; open <http://localhost:3000>.
2. Users (password `Password1!` for all): **alice** "Alice Tester" with 4 tasks, **bob** "Bob Builder"
   with 1, **carol** "Carol Newcomer" with none.
3. Before each case put the seed data back: `POST http://localhost:3000/api/test/reset`.
4. API cases: curl/Postman; protected routes need `Authorization: Bearer <token>` from `POST /api/login`.
5. Cases marked _needs a proxy_ change the server's answers: use browser DevTools › Network
   (block request, override content, throttling) or a proxy such as Charles / mitmproxy. Cases marked
   _needs a fixed date_ need the computer's clock set to that date (the automated tests freeze the
   browser clock instead).

Alice's seeded tasks, newest first:

| Title                              | Priority | Due         | Done |
| ---------------------------------- | -------- | ----------- | ---- |
| Prepare sprint demo                | high     | 15 Jan 2030 | no   |
| Review pull requests               | medium   | none        | no   |
| Renew test environment certificate | high     | 1 Oct 2026  | no   |
| Update test plan                   | low      | 30 Sep 2026 | yes  |

## Summary

| ID               | Title                                                        | Type                 | Priority |
| ---------------- | ------------------------------------------------------------ | -------------------- | -------- |
| TC-101           | Status filter shows active, done and all tasks               | UI                   | High     |
| TC-102           | The filter is sent to the API as a query parameter           | UI / Network         | Low      |
| TC-103           | Search waits until typing stops for 300 ms                   | UI                   | Medium   |
| TC-104           | Search and status filter combine; "nothing matches" message  | UI                   | Medium   |
| TC-105           | Login through the form shows the board with the user name    | UI / Smoke           | High     |
| TC-106           | Wrong password: server message, stays on login               | UI / Negative        | High     |
| TC-107           | Login button is disabled while the request runs              | UI                   | Low      |
| TC-108           | Visitor without a login is sent to the login page            | UI / Security        | High     |
| TC-109           | A stored session opens the board directly                    | UI                   | Medium   |
| TC-110           | Log out removes the token and keeps the board closed         | UI / Security        | High     |
| TC-111           | An invalid stored token leads back to login                  | UI / Security        | Medium   |
| TC-112           | Task list newest first, with the count                       | UI / Smoke           | High     |
| TC-113           | Priority, due date and done tasks are shown correctly        | UI                   | Medium   |
| TC-114           | Mark a task done and reopen it                               | UI                   | High     |
| TC-115           | Rename a task in place with Enter                            | UI                   | High     |
| TC-116           | Escape cancels editing, nothing is sent                      | UI                   | Medium   |
| TC-117           | Delete a task after confirming                               | UI                   | High     |
| TC-118           | Cancelled confirmation keeps the task                        | UI                   | Medium   |
| TC-119           | Empty board shows the empty state                            | UI                   | Low      |
| TC-120           | Add a task with priority and due date; form clears           | UI / Smoke           | High     |
| TC-121           | Title length is checked before calling the API               | UI / Negative        | Medium   |
| TC-122           | Tasks and login survive a page reload                        | UI                   | Medium   |
| TC-123           | Open task is overdue the day after its due date              | UI                   | High     |
| TC-124           | Not overdue on the due date itself                           | UI / Boundary        | Medium   |
| TC-125           | A done task is never overdue                                 | UI                   | Medium   |
| TC-126           | Toast hides after exactly 3 seconds                          | UI                   | Low      |
| TC-127           | Loading state while the list is slow                         | UI / Network         | Medium   |
| TC-128           | Server error shows a banner; Retry recovers                  | UI / Network         | High     |
| TC-129           | Network failure shows a banner                               | UI / Network         | Medium   |
| TC-130           | The board renders whatever the API returns                   | UI / Network         | Low      |
| TC-131           | Server validation message shown, input kept                  | UI / Network         | Medium   |
| TC-132           | Expired login (401) leads to the login page                  | UI / Security        | High     |
| TC-133           | Every API call carries the Bearer token                      | UI / Security        | Medium   |
| TC-201           | Login with valid credentials returns token and user          | API / Smoke          | High     |
| TC-202           | Wrong password: 401 with a clear message                     | API / Negative       | High     |
| TC-203           | Unknown user gets the same message as a wrong password       | API / Security       | High     |
| TC-204 to TC-207 | Broken login bodies: 400                                     | API / Negative       | Medium   |
| TC-208           | Protected routes without or with an unknown token: 401       | API / Security       | High     |
| TC-209           | `/api/me` returns the logged-in user                         | API                  | Medium   |
| TC-210           | Token is unusable after logout                               | API / Security       | High     |
| TC-211           | List shows only the user's tasks, newest first, per contract | API / Smoke          | High     |
| TC-212           | Filter by status and case-insensitive search                 | API                  | Medium   |
| TC-213           | Unknown status filter: 400                                   | API / Negative       | Low      |
| TC-214           | Create a task with defaults: 201                             | API / Smoke          | High     |
| TC-215           | Title is trimmed before saving                               | API                  | Low      |
| TC-216           | Partial update changes `updatedAt`                           | API                  | Medium   |
| TC-217           | Deleted task is gone                                         | API                  | High     |
| TC-218           | Another user's task: 404 on read, update, delete             | API / Security       | High     |
| TC-219           | Reset puts the seed data back                                | API                  | Low      |
| TC-220 to TC-228 | Invalid new tasks: 400 naming the field, nothing saved       | API / Negative       | High     |
| TC-229           | Titles of exactly 3 and 80 characters are accepted           | API / Boundary       | Medium   |
| TC-230           | Invalid updates are refused, task unchanged                  | API / Negative       | Medium   |
| TC-231           | Body that is not JSON: 400                                   | API / Negative       | Low      |
| TC-301           | Filter bar marks the current filter                          | Component            | Low      |
| TC-302           | Filter bar reports the chosen status                         | Component            | Low      |
| TC-303           | Filter bar reports every search keystroke                    | Component            | Low      |
| TC-304           | Task form sends title, priority, due date and clears         | Component            | Medium   |
| TC-305           | Task form sends no due date when none is chosen              | Component            | Low      |
| TC-306 / TC-307  | Task form refuses 2- and 81-character titles                 | Component / Boundary | Medium   |
| TC-308           | Task form button is disabled while saving                    | Component            | Low      |
| TC-309           | Task form shows a save error and keeps the input             | Component            | Medium   |
| TC-310           | Task row shows title, priority and formatted due date        | Component            | Medium   |
| TC-311           | Task row shows "Overdue" only for an open past-due task      | Component            | Medium   |
| TC-312           | Done task row: no "Overdue", struck through, ticked          | Component            | Low      |
| TC-313           | Ticking a row reports the new state                          | Component            | Low      |
| TC-314           | Rename reports the trimmed title, not an unchanged one       | Component            | Low      |
| TC-315           | Delete only after confirming                                 | Component            | Medium   |
| TC-316           | Toast renders nothing without a message                      | Component            | Low      |
| TC-317           | Toast is a status message and ends after 3 s                 | Component            | Low      |

---

## UI: filters and search (`cypress/e2e/ui/filters.cy.ts`)

Preconditions for all: data reset, logged in as alice, board open.

### TC-101 Status filter shows active, done and all tasks

| #   | Step             | Expected result                                                        |
| --- | ---------------- | ---------------------------------------------------------------------- |
| 1   | Click **Active** | **Active** is marked as pressed; 3 tasks; "Update test plan" not shown |
| 2   | Click **Done**   | Only "Update test plan"                                                |
| 3   | Click **All**    | 4 tasks; **Active** no longer pressed                                  |

### TC-102 The filter is sent to the API as a query parameter

| #   | Step                                 | Expected result              |
| --- | ------------------------------------ | ---------------------------- |
| 1   | DevTools › Network; reload the board | `GET /api/tasks?status=all`  |
| 2   | Click **Done**                       | `GET /api/tasks?status=done` |

### TC-103 Search waits until typing stops for 300 ms

| #   | Step                                                     | Expected result                                                                           |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | DevTools › Network; type `pull` quickly into **Search…** | No request per keystroke; one `GET /api/tasks?...&q=pull` about 300 ms after the last key |
| 2   | Look at the list                                         | Only "Review pull requests"                                                               |

### TC-104 Search and status filter combine; "nothing matches" message

| #   | Step                  | Expected result               |
| --- | --------------------- | ----------------------------- |
| 1   | Search `test`         | 2 tasks                       |
| 2   | Click **Done**        | Only "Update test plan"       |
| 3   | Search `no such task` | "No tasks match this filter." |

## UI: login (`cypress/e2e/ui/login.cy.ts`)

### TC-105 Login through the form shows the board with the user name

| #   | Step                                                    | Expected result                              |
| --- | ------------------------------------------------------- | -------------------------------------------- |
| 1   | Open `/login`, enter `alice` / `Password1!`, **Log in** | Board at `/`; header "Alice Tester"; 4 tasks |

### TC-106 Wrong password: server message, stays on login

| #   | Step                                         | Expected result                                 |
| --- | -------------------------------------------- | ----------------------------------------------- |
| 1   | Enter `alice` / `wrong-password`, **Log in** | "Wrong username or password"; still on `/login` |

### TC-107 Login button is disabled while the request runs

_Needs a proxy_ (or DevTools throttling "Slow 3G").

| #   | Step                                                | Expected result                     |
| --- | --------------------------------------------------- | ----------------------------------- |
| 1   | Slow down `POST /api/login`, submit any credentials | Button disabled, text "Logging in…" |
| 2   | Wait for the answer                                 | Button enabled again, text "Log in" |

### TC-108 Visitor without a login is sent to the login page

| #   | Step                          | Expected result                              |
| --- | ----------------------------- | -------------------------------------------- |
| 1   | Clear Local Storage, open `/` | Redirect to `/login`; username field visible |

### TC-109 A stored session opens the board directly

| #   | Step                                         | Expected result                                          |
| --- | -------------------------------------------- | -------------------------------------------------------- |
| 1   | Log in as bob, close the tab, open `/` again | Board opens without the login form; header "Bob Builder" |

### TC-110 Log out removes the token and keeps the board closed

| #   | Step                                | Expected result                                  |
| --- | ----------------------------------- | ------------------------------------------------ |
| 1   | Logged in as bob, click **Log out** | `/login`; Local Storage has no `taskboard.token` |
| 2   | Open `/`                            | Back to `/login`                                 |

### TC-111 An invalid stored token leads back to login

| #   | Step                                                                                      | Expected result                                                     |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | In Local Storage set `taskboard.token` = `00000000-0000-4000-8000-000000000000`, open `/` | The API answers 401; the app goes to `/login` and removes the token |

## UI: tasks (`cypress/e2e/ui/tasks.cy.ts`)

TC-112 to TC-118: logged in as alice. TC-119 to TC-122: logged in as carol (no tasks).

### TC-112 Task list newest first, with the count

| #   | Step           | Expected result                                                                                                   |
| --- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Open the board | "4 tasks"; order: Prepare sprint demo, Review pull requests, Renew test environment certificate, Update test plan |

### TC-113 Priority, due date and done tasks are shown correctly

| #   | Step                           | Expected result                    |
| --- | ------------------------------ | ---------------------------------- |
| 1   | Look at "Prepare sprint demo"  | Priority `high`, due "15 Jan 2030" |
| 2   | Look at "Review pull requests" | No due date                        |
| 3   | Look at "Update test plan"     | Struck through, checkbox ticked    |

### TC-114 Mark a task done and reopen it

| #   | Step                        | Expected result                       |
| --- | --------------------------- | ------------------------------------- |
| 1   | Tick "Review pull requests" | Toast "Task done"; row struck through |
| 2   | Untick it                   | Toast "Task reopened"; row normal     |

### TC-115 Rename a task in place with Enter

| #   | Step                                                                                   | Expected result                                     |
| --- | -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | **Edit** on "Review pull requests", type `Review and merge pull requests`, press Enter | Toast "Task updated"; new title shown, old one gone |

### TC-116 Escape cancels editing, nothing is sent

| #   | Step                                          | Expected result                                      |
| --- | --------------------------------------------- | ---------------------------------------------------- |
| 1   | **Edit**, type `Something else`, press Escape | Old title stays; DevTools: no `PATCH /api/tasks/...` |

### TC-117 Delete a task after confirming

| #   | Step                                 | Expected result                                 |
| --- | ------------------------------------ | ----------------------------------------------- |
| 1   | **Delete** on "Review pull requests" | Browser dialog `Delete "Review pull requests"?` |
| 2   | Click **OK**                         | Toast "Task deleted"; 3 tasks left              |

### TC-118 Cancelled confirmation keeps the task

| #   | Step                                                   | Expected result |
| --- | ------------------------------------------------------ | --------------- |
| 1   | **Delete** on "Review pull requests", click **Cancel** | Still 4 tasks   |

### TC-119 Empty board shows the empty state

| #   | Step            | Expected result                                         |
| --- | --------------- | ------------------------------------------------------- |
| 1   | Log in as carol | "No tasks yet. Add your first one above."; no task rows |

### TC-120 Add a task with priority and due date; form clears

| #   | Step                                                                     | Expected result                                                                                       |
| --- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 1   | Title `Task 1 abc123`, priority **High**, due `2030-05-20`, **Add task** | Request body `{"title":"Task 1 abc123","priority":"high","dueDate":"2030-05-20"}`; toast "Task added" |
| 2   | Look at the new row and the form                                         | Priority `high`, due "20 May 2030"; title field empty; "1 task"                                       |

### TC-121 Title length is checked before calling the API

| #   | Step                                | Expected result                               |
| --- | ----------------------------------- | --------------------------------------------- |
| 1   | Title `ab`, **Add task**            | "Title must be 3-80 characters"               |
| 2   | Title of three spaces, **Add task** | Error shown again                             |
| 3   | DevTools Network                    | No `POST /api/tasks`; empty state still shown |

### TC-122 Tasks and login survive a page reload

| #   | Step                        | Expected result                                  |
| --- | --------------------------- | ------------------------------------------------ |
| 1   | Add a task, reload the page | The task is still there; header "Carol Newcomer" |

## UI: time (`cypress/e2e/ui/time.cy.ts`)

Logged in as alice. _Needs a fixed date_ for TC-123 to TC-125.

### TC-123 Open task is overdue the day after its due date

| #   | Step                            | Expected result                                                                        |
| --- | ------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Date 2 Oct 2026, open the board | "Renew test environment certificate" shows **Overdue**; "Prepare sprint demo" does not |

### TC-124 Not overdue on the due date itself

| #   | Step                            | Expected result                                         |
| --- | ------------------------------- | ------------------------------------------------------- |
| 1   | Date 1 Oct 2026, open the board | "Renew test environment certificate" has no **Overdue** |

### TC-125 A done task is never overdue

| #   | Step                            | Expected result                                                                                               |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Date 1 Jan 2027, open the board | "Update test plan" (done, due 30 Sep 2026): no **Overdue**; "Renew test environment certificate": **Overdue** |

### TC-126 Toast hides after exactly 3 seconds

| #   | Step                                         | Expected result                                  |
| --- | -------------------------------------------- | ------------------------------------------------ |
| 1   | Add a task, watch the toast with a stopwatch | "Task added" is visible for 3 s, then disappears |

## UI: network conditions (`cypress/e2e/ui/network.cy.ts`)

Logged in as alice. All cases _need a proxy_ except TC-133.

### TC-127 Loading state while the list is slow

| #   | Step                                            | Expected result            |
| --- | ----------------------------------------------- | -------------------------- |
| 1   | Delay `GET /api/tasks` by 1.5 s, open the board | "Loading tasks…", no rows  |
| 2   | Wait                                            | Loading text gone; 4 tasks |

### TC-128 Server error shows a banner; Retry recovers

| #   | Step                                                                        | Expected result                      |
| --- | --------------------------------------------------------------------------- | ------------------------------------ |
| 1   | Answer the first `GET /api/tasks` with `500` `{"error":"Database is down"}` | Banner containing "Database is down" |
| 2   | Remove the override, click **Retry**                                        | Banner gone; 4 tasks                 |

### TC-129 Network failure shows a banner

| #   | Step                                                                  | Expected result                                                    |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Block `GET /api/tasks` (DevTools › Block request URL), open the board | Error banner (browser's own text, e.g. "Failed to fetch"); no rows |

### TC-130 The board renders whatever the API returns

| #   | Step                                                                             | Expected result                                                 |
| --- | -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | Answer `GET /api/tasks` with `cypress/fixtures/tasks.json`                       | "3 tasks"                                                       |
| 2   | Look at "Stubbed finished task" (done, due 2020) and "Stubbed low-priority task" | No **Overdue** on the finished one; priority `low` on the other |

### TC-131 Server validation message shown, input kept

| #   | Step                                                                                                                | Expected result                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | Answer `POST /api/tasks` with `400` `{"error":"A task with this title already exists","field":"title"}`; add a task | Form shows "A task with this title already exists"; the title is still in the field |

### TC-132 Expired login (401) leads to the login page

| #   | Step                                                                           | Expected result      |
| --- | ------------------------------------------------------------------------------ | -------------------- |
| 1   | Answer `GET /api/tasks` with `401` `{"error":"Not logged in"}`, open the board | Redirect to `/login` |

### TC-133 Every API call carries the Bearer token

| #   | Step                               | Expected result                                                             |
| --- | ---------------------------------- | --------------------------------------------------------------------------- |
| 1   | DevTools › Network; open the board | `GET /api/me` and `GET /api/tasks` both have `Authorization: Bearer <uuid>` |

---

## API: authentication (`cypress/e2e/api/auth.cy.ts`)

### TC-201 Login with valid credentials returns token and user

| #   | Step                                                             | Expected result                                                                                     |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | `POST /api/login` `{"username":"alice","password":"Password1!"}` | `200`; `token`; `user` with `username` `alice`, `name` "Alice Tester"; no password, no extra fields |

### TC-202 Wrong password: 401 with a clear message

| #   | Step                                 | Expected result                                 |
| --- | ------------------------------------ | ----------------------------------------------- |
| 1   | Login as alice with `wrong-password` | `401`, `{"error":"Wrong username or password"}` |

### TC-203 Unknown user gets the same message as a wrong password

| #   | Step                                      | Expected result                                                             |
| --- | ----------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Login as `mallory` with the demo password | `401`, "Wrong username or password" (does not reveal which usernames exist) |

### TC-204 to TC-207 Broken login bodies: 400

Every row: `POST /api/login` with the body; expected `400`, `{"error":"Username and password are required"}`.

| ID     | Body                                 |
| ------ | ------------------------------------ |
| TC-204 | `{"username":"alice"}` (no password) |
| TC-205 | `{"password":"x"}` (no username)     |
| TC-206 | `{"username":"","password":""}`      |
| TC-207 | `{"username":42,"password":"x"}`     |

### TC-208 Protected routes without or with an unknown token: 401

| #   | Step                                                             | Expected result |
| --- | ---------------------------------------------------------------- | --------------- |
| 1   | `GET /api/tasks` without `Authorization`                         | `401`           |
| 2   | `GET /api/me` with `Bearer 00000000-0000-4000-8000-000000000000` | `401`           |

### TC-209 `/api/me` returns the logged-in user

| #   | Step                                        | Expected result         |
| --- | ------------------------------------------- | ----------------------- |
| 1   | Log in as bob; `GET /api/me` with the token | `200`, `username` `bob` |

### TC-210 Token is unusable after logout

| #   | Step                                               | Expected result |
| --- | -------------------------------------------------- | --------------- |
| 1   | Log in as carol; `POST /api/logout` with the token | `204`           |
| 2   | `GET /api/me` with the same token                  | `401`           |

## API: tasks (`cypress/e2e/api/tasks.cy.ts`)

Data reset before each case.

### TC-211 List shows only the user's tasks, newest first, per contract

| #   | Step                      | Expected result                                                                                                                                       |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | As alice `GET /api/tasks` | `200`; 4 tasks in the order of the seed table above (bob's task not included); each task has id, title, priority, dueDate, done, createdAt, updatedAt |

### TC-212 Filter by status and case-insensitive search

| #   | Step                           | Expected result             |
| --- | ------------------------------ | --------------------------- |
| 1   | `GET /api/tasks?status=done`   | 1 task                      |
| 2   | `GET /api/tasks?status=active` | 3 tasks                     |
| 3   | `GET /api/tasks?q=REVIEW`      | Only "Review pull requests" |

### TC-213 Unknown status filter: 400

| #   | Step                             | Expected result         |
| --- | -------------------------------- | ----------------------- |
| 1   | `GET /api/tasks?status=archived` | `400`, `field` `status` |

### TC-214 Create a task with defaults: 201

| #   | Step                                                   | Expected result                                              |
| --- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 1   | As carol `POST /api/tasks` `{"title":"Task 1 abc123"}` | `201`; `priority` `medium`, `dueDate` `null`, `done` `false` |
| 2   | `GET /api/tasks`                                       | 1 task                                                       |

### TC-215 Title is trimmed before saving

| #   | Step                                    | Expected result        |
| --- | --------------------------------------- | ---------------------- |
| 1   | Create `{"title":"   Padded title   "}` | `title` `Padded title` |

### TC-216 Partial update changes `updatedAt`

| #   | Step                                                                                  | Expected result                                                                       |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | Create a low-priority task; `PATCH /api/tasks/<id>` `{"done":true,"priority":"high"}` | `200`; title unchanged, `done` `true`, `priority` `high`; `updatedAt` ≥ the old value |

### TC-217 Deleted task is gone

| #   | Step                                    | Expected result  |
| --- | --------------------------------------- | ---------------- |
| 1   | Create a task; `DELETE /api/tasks/<id>` | `204`            |
| 2   | `GET` the same id; `DELETE` it again    | `404` both times |

### TC-218 Another user's task: 404 on read, update, delete

| #   | Step                                                                           | Expected result                                                |
| --- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| 1   | As alice `GET`, `PATCH {"done":true}` and `DELETE` `/api/tasks/seed-5` (bob's) | `404` each time (404, not 403: does not reveal that it exists) |
| 2   | As bob `GET /api/tasks/seed-5`                                                 | Unchanged, `done` `false`                                      |

### TC-219 Reset puts the seed data back

| #   | Step                               | Expected result |
| --- | ---------------------------------- | --------------- |
| 1   | As alice delete the first task     | 3 tasks         |
| 2   | `POST /api/test/reset`, list again | 4 tasks         |

## API: validation (`cypress/e2e/api/validation.cy.ts`)

### TC-220 to TC-228 Invalid new tasks: 400 naming the field, nothing saved

Every row: as carol `POST /api/tasks` with the body; expected `400` with exactly
`{"error": <message>, "field": <field>}`, and `GET /api/tasks` still returns no tasks.

| ID     | Body                                             | field      | error                                          |
| ------ | ------------------------------------------------ | ---------- | ---------------------------------------------- |
| TC-220 | `{"priority":"high"}`                            | `title`    | Title is required                              |
| TC-221 | `{"title":"ab"}`                                 | `title`    | Title must be 3-80 characters                  |
| TC-222 | title of 81 × `x`                                | `title`    | Title must be 3-80 characters                  |
| TC-223 | `{"title":"      "}`                             | `title`    | Title must be 3-80 characters                  |
| TC-224 | `{"title":"Valid title","priority":"urgent"}`    | `priority` | Priority must be one of: low, medium, high     |
| TC-225 | `{"title":"Valid title","dueDate":"2026-02-30"}` | `dueDate`  | Due date must be a date in the form YYYY-MM-DD |
| TC-226 | `{"title":"Valid title","dueDate":"16.10.2026"}` | `dueDate`  | Due date must be a date in the form YYYY-MM-DD |
| TC-227 | `{"title":"Valid title","titel":"typo"}`         | `titel`    | Unknown field: titel                           |
| TC-228 | `{"title":"Valid title","done":true}`            | `done`     | Unknown field: done                            |

### TC-229 Titles of exactly 3 and 80 characters are accepted

| #   | Step                       | Expected result |
| --- | -------------------------- | --------------- |
| 1   | Create `{"title":"abc"}`   | `201`           |
| 2   | Create a title of 80 × `x` | `201`           |

### TC-230 Invalid updates are refused, task unchanged

| #   | Step                                | Expected result                  |
| --- | ----------------------------------- | -------------------------------- |
| 1   | Create a task; `PATCH` it with `{}` | `400`, error "Nothing to update" |
| 2   | `PATCH` with `{"done":"yes"}`       | `400`, field `done`              |
| 3   | `PATCH` with `{"id":"other-id"}`    | `400`, field `id`                |
| 4   | `GET` the task                      | Exactly as created               |

### TC-231 Body that is not JSON: 400

| #   | Step                                                                                   | Expected result                              |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | `POST /api/tasks` with body `{"title": "unclosed` and `Content-Type: application/json` | `400`, `{"error":"Body must be valid JSON"}` |

---

## Components (`cypress/component/*.cy.tsx`)

The automated tests mount one React component without the server. By hand, the same behaviour is
checked on the running board (logged in as alice unless stated).

### TC-301 Filter bar marks the current filter

| #   | Step           | Expected result                                                                         |
| --- | -------------- | --------------------------------------------------------------------------------------- |
| 1   | Click **Done** | **Done** is pressed (`aria-pressed="true"` in DevTools); **All** and **Active** are not |

### TC-302 Filter bar reports the chosen status

| #   | Step             | Expected result                                                                      |
| --- | ---------------- | ------------------------------------------------------------------------------------ |
| 1   | Click **Active** | The list changes to active tasks (the board received the status); **Active** pressed |

### TC-303 Filter bar reports every search keystroke

| #   | Step       | Expected result                                                                |
| --- | ---------- | ------------------------------------------------------------------------------ |
| 1   | Type `abc` | The field shows each letter as typed (the board debounces the request, TC-103) |

### TC-304 Task form sends title, priority, due date and clears

| #   | Step                                                                           | Expected result                                                                               |
| --- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 1   | Title `  Plan the release  `, priority **Low**, due `2030-03-01`, **Add task** | Request body `{"title":"Plan the release","priority":"low","dueDate":"2030-03-01"}` (trimmed) |
| 2   | Look at the form                                                               | Title empty; priority back to **Medium**                                                      |

### TC-305 Task form sends no due date when none is chosen

| #   | Step                          | Expected result                                       |
| --- | ----------------------------- | ----------------------------------------------------- |
| 1   | Title `No date`, **Add task** | Request body has `"priority":"medium","dueDate":null` |

### TC-306 / TC-307 Task form refuses 2- and 81-character titles

| ID     | Title    | Expected result                             |
| ------ | -------- | ------------------------------------------- |
| TC-306 | `ab`     | "Title must be 3-80 characters"; no request |
| TC-307 | 81 × `x` | Same                                        |

### TC-308 Task form button is disabled while saving

_Needs a proxy_ (slow `POST /api/tasks`).

| #   | Step                    | Expected result            |
| --- | ----------------------- | -------------------------- |
| 1   | Add `Slow save`         | Button disabled, "Adding…" |
| 2   | When the answer arrives | Button enabled, "Add task" |

### TC-309 Task form shows a save error and keeps the input

Same as TC-131: the error under the form, the title stays in the field.

### TC-310 Task row shows title, priority and formatted due date

| #   | Step                                         | Expected result                                    |
| --- | -------------------------------------------- | -------------------------------------------------- |
| 1   | Look at "Renew test environment certificate" | Priority `high` (styled as high), due "1 Oct 2026" |

### TC-311 / TC-312 "Overdue" only for open past-due tasks; done rows struck through

See TC-123 and TC-125 (same rule on the board); a done row is struck through and its box ticked.

### TC-313 Ticking a row reports the new state

See TC-114.

### TC-314 Rename reports the trimmed title, not an unchanged one

| #   | Step                                                                              | Expected result                |
| --- | --------------------------------------------------------------------------------- | ------------------------------ |
| 1   | **Edit**: the field has focus and holds the title; click **Save** without changes | No `PATCH` request             |
| 2   | **Edit**, replace with `  New title  `, Enter                                     | `PATCH` with title `New title` |

### TC-315 Delete only after confirming

See TC-117 and TC-118; the dialog text is `Delete "<title>"?`.

### TC-316 Toast renders nothing without a message

| #   | Step                                  | Expected result  |
| --- | ------------------------------------- | ---------------- |
| 1   | Open the board without doing anything | No toast element |

### TC-317 Toast is a status message and ends after 3 s

| #   | Step                          | Expected result                                                      |
| --- | ----------------------------- | -------------------------------------------------------------------- |
| 1   | Add a task; inspect the toast | `role="status"`, text "Task added"; it disappears after 3 s (TC-126) |
