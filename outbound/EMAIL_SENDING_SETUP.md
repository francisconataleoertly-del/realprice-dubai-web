# FonatProp Gmail Sending Setup

This is only needed if you want the local script to send emails from `fonatprop@gmail.com`.

Safer first option:

1. Open `outbound/generated/day1_gmail_compose_links.html`.
2. Click each Gmail draft link.
3. Review the message.
4. Press Send manually.

Automated option:

1. Enable 2-Step Verification on the Gmail account.
2. Create a Gmail App Password for Mail.
3. Do not paste your normal Gmail password into the repo.
4. In PowerShell, set the app password only for the current terminal:

```powershell
$env:FONATPROP_GMAIL_APP_PASSWORD = "PASTE_APP_PASSWORD_HERE"
```

5. Dry-run one email:

```powershell
python scripts/fonatprop_send_emails.py --limit 1
```

6. Send one real test email:

```powershell
python scripts/fonatprop_send_emails.py --send --limit 1
```

7. If that works, send the first five slowly:

```powershell
python scripts/fonatprop_send_emails.py --send --limit 5 --delay 120
```

Recommended first-day limit: 15 emails maximum.

