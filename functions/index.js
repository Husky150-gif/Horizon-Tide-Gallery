const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Configure SendGrid key via: firebase functions:config:set sendgrid.key="YOUR_SENDGRID_KEY"
const sendgridKey = functions.config().sendgrid && functions.config().sendgrid.key;
if (sendgridKey) sgMail.setApiKey(sendgridKey);

exports.sendReportEmail = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};

    const to = 'horizontidegallery@gmail.com';
    const from = 'no-reply@horizontidegallery.com';
    const subject = `Reported comment: ${data.commentId || 'unknown'}`;

    const text = `Reporter: ${data.reporterEmail || 'anonymous'}\nReason: ${data.reason || ''}\n\nComment ID: ${data.commentId}\nComment text: ${data.commentText || ''}\n\nTimestamp: ${data.createdAt ? data.createdAt.toDate() : ''}`;

    if (!sendgridKey) {
      console.warn('SendGrid key not configured; skipping sending email.');
      return null;
    }

    const msg = {
      to,
      from,
      subject,
      text
    };

    try {
      await sgMail.send(msg);
      console.log('Report email sent for', context.params.reportId);
    } catch (err) {
      console.error('Failed to send report email', err);
    }

    return null;
  });
