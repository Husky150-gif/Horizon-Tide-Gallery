const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

function readLegacyRuntimeConfig() {
  const rawConfig = process.env.CLOUD_RUNTIME_CONFIG;
  if (!rawConfig) return {};
  try {
    return JSON.parse(rawConfig);
  } catch (error) {
    console.warn('Failed to parse CLOUD_RUNTIME_CONFIG; using direct environment variables only.');
    return {};
  }
}

const legacyRuntimeConfig = readLegacyRuntimeConfig();
const sendgridKey =
  process.env.SENDGRID_KEY ||
  process.env.SENDGRID_API_KEY ||
  (legacyRuntimeConfig.sendgrid && legacyRuntimeConfig.sendgrid.key);

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

function normalizeQueueOwnerFromItemType(itemType) {
  const raw = String(itemType || '').toLowerCase();
  const lopsideKeywords = ['fursuit', 'paw', 'tail', 'partial', 'head', 'feet'];
  if (lopsideKeywords.some((keyword) => raw.includes(keyword))) {
    return 'lopside';
  }
  return 'husky';
}

function toPublicDisplayName(name) {
  const safe = String(name || '').trim();
  if (!safe) return 'Guest';
  return safe.slice(0, 42);
}

function normalizePreorderStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function getQueueSyncPlanFromPreorderStatus(status) {
  const normalized = normalizePreorderStatus(status);

  if (normalized === 'in progress') {
    return { shouldExist: true, queueStatus: 'Started' };
  }

  if (normalized === 'finished' || normalized === 'shipped') {
    return { shouldExist: true, queueStatus: 'Finished' };
  }

  return { shouldExist: false, queueStatus: '' };
}

exports.syncPreorderToCommissionQueue = functions.firestore
  .document('preorders/{preorderDocId}')
  .onWrite(async (change, context) => {
    const afterData = change.after.exists ? (change.after.data() || {}) : null;
    if (!afterData) return null;

    const orderId = String(afterData.orderId || '').trim();
    if (!orderId) {
      console.warn('Preorder missing orderId; skipping queue sync.', context.params.preorderDocId);
      return null;
    }

    const plan = getQueueSyncPlanFromPreorderStatus(afterData.status);
    const commissionDocId = `auto_${orderId}`;
    const commissionRef = admin.firestore().collection('commissions').doc(commissionDocId);

    if (!plan.shouldExist) {
      try {
        await commissionRef.delete();
        console.log('Removed auto queue entry due to preorder status:', afterData.status, orderId);
      } catch (error) {
        if (error && error.code === 5) {
          return null;
        }
        console.error('Failed removing auto queue entry for preorder status:', orderId, error);
      }
      return null;
    }

    const itemType = String(afterData.itemType || afterData.orderType || 'Commission').trim();
    const payload = {
      commissionId: orderId,
      preorderOrderId: orderId,
      displayName: toPublicDisplayName(afterData.name),
      commissionType: itemType,
      queueOwner: normalizeQueueOwnerFromItemType(itemType),
      queueStatus: plan.queueStatus,
      sourceType: 'Website Preorder',
      isPublic: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!change.before.exists) {
      payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    try {
      await commissionRef.set(payload, { merge: true });
      console.log('Synced preorder to commission queue (status-gated):', orderId, afterData.status);
    } catch (error) {
      console.error('Failed syncing preorder to commission queue (status-gated):', orderId, error);
    }

    return null;
  });

exports.cleanupCommissionQueueOnPreorderDelete = functions.firestore
  .document('preorders/{preorderDocId}')
  .onDelete(async (snap) => {
    const data = snap.data() || {};
    const orderId = String(data.orderId || '').trim();
    if (!orderId) return null;

    const commissionDocId = `auto_${orderId}`;
    try {
      await admin.firestore().collection('commissions').doc(commissionDocId).delete();
      console.log('Removed auto queue entry for deleted preorder:', orderId);
    } catch (error) {
      console.error('Failed deleting auto queue entry for preorder:', orderId, error);
    }

    return null;
  });
