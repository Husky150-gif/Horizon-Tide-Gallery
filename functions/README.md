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
# choose existing project, node 18, JavaScript
```

3. Install dependencies:

```bash
cd functions
npm install
```

4. Configure SendGrid key (replace with your key):

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

5. Deploy functions:

```bash
firebase deploy --only functions
```

Notes:
- The function expects SendGrid to be configured via `functions.config().sendgrid.key`.
- Verify the `from` address in SendGrid (or set to a verified sender).
- You may want to harden Firestore rules to restrict who can write reports, or rate-limit from client side.
