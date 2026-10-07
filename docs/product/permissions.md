# Roles and per-user permissions

| Role | CRM visibility | Staff/leave management | Content navigation | Settings |
| --- | --- | --- | --- | --- |
| SuperAdmin | All active/lost/won leads, reporting and commissions | All users/teams, grants, approvals and exports | Projects, Journal, Website | Personal and agency settings |
| Team lead | Own team active/lost/won leads and team reporting | Invite agents into own team, assign leads, approve eligible team staff leave; own leave approved by SuperAdmin | Hidden unless this individual has contentEdit | Personal settings |
| Agent | Own active/lost/won leads and own earnings; shared leaderboards | Own leave requests and cancellation requests; no approvals | Hidden unless this individual has contentEdit | Personal settings |
| Editor | CRM dashboard, leads, sales, commissions and rankings hidden | Own leave/calendar/profile only | Projects, Journal, Website when this individual has contentEdit | Personal settings |

contentEdit is an individual user flag, not a role-wide grant. SuperAdmin inherently has content access. It does not widen lead visibility or permit user/team/commission administration. Project inventory may be read by CRM staff to discuss properties; authoring routes still require contentEdit.

Temporary acting lead: team active-lead management, assignment, agent invitations and eligible leave approval while cover is active. No team lost/won access or team earnings; retains own records. Per-user contentEdit remains independent.

Deactivated users cannot authenticate. Sidebar and page mount use the same PermissionComponent/hasPermission rules. Page permissions select CRM, content or personal workspace; finer action controls remain inside pages. Every sensitive route also checks server authorization. Only SuperAdmin exports. Sign out deletes the server session, clears its cookie and removes displayed user/notification/page state.

Local baseline fixtures: owner all access; lead contentEdit false; agent contentEdit false; editor contentEdit true. Initially the demo team lead had a content grant; corrected for role testing on 2026-10-07.
