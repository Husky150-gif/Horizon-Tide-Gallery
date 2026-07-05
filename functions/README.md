Setup & deploy

1. Install Firebase CLI and login:

```bash
npm install -g firebase-tools
firebase login
```

2. Initialize functions (if not already):

```bash
cd functions
firebase init functions
# choose existing project, node 22, JavaScript
```

3. Install dependencies:

```bash
cd functions
npm install
```

4. Configure SendGrid key (replace with your key):

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
# or set SENDGRID_KEY as an environment variable in your deploy environment
```

5. Deploy functions:

```bash
firebase deploy --only functions
```

Notes:
- The function reads SendGrid key from `SENDGRID_KEY` (with legacy config fallback).
- Verify the `from` address in SendGrid (or set to a verified sender/domain).
- Milestone emails send when preorder status changes.
- One-click reminder requests are processed from `reports` docs with `requestType = customer_payment_reminder_request`.
