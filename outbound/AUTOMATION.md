# FonatProp Outreach Automation

The daily automation sends a controlled batch from `fonatprop@gmail.com`.

It does:

- Regenerate the next batch from `outbound/leads.csv`.
- Skip already-sent emails using `outbound/generated/email_send_log.csv`.
- Send only the next safe batch.
- Update contacted leads after sending.
- Write a task log to `outbound/generated/daily_outreach_task.log`.

Default scheduled task:

- Name: `FonatProp Daily Outreach`
- Daily time: 10:30 Argentina time
- Limit: 15 emails per run
- Delay: 90 seconds between emails

Manual dry-run:

```powershell
python scripts/fonatprop_daily_outreach.py --dry-run --limit 15
```

Manual run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/fonatprop_daily_outreach.ps1 -Limit 15 -Delay 90
```

Security:

- The Gmail app password is stored encrypted with Windows DPAPI under the current Windows user.
- It is not stored in the repo.
- If you rotate the Gmail App Password, update the encrypted local secret.

