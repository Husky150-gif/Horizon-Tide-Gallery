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
function readSendgridKey() {
  const directKey =
    process.env.SENDGRID_KEY ||
    process.env.SENDGRID_KEY_ ||
    process.env['SENDGRID_KEY '] ||
    process.env.SENDGRID_API_KEY ||
    (legacyRuntimeConfig.sendgrid && legacyRuntimeConfig.sendgrid.key);

  return String(directKey || '').trim();
}

const sendgridKey = readSendgridKey();

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

  if (normalized === 'accepted') {
    return { shouldExist: true, queueStatus: 'Not Started' };
  }

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

function parseMoney(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, num);
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function isLopsideFursuitOrder(order) {
  const owner = normalizeQueueOwnerFromItemType(order?.itemType || order?.orderType || '');
  if (owner === 'lopside') return true;
  const text = String(order?.itemType || order?.orderType || '').toLowerCase();
  return text.includes('fursuit') || text.includes('paw') || text.includes('tail') || text.includes('partial') || text.includes('head');
}

function getOrderReminderPlan(order) {
  const status = normalizeStatus(order?.status);
  const quoteAmount = parseMoney(order?.quoteAmount);
  const paidAmount = parseMoney(order?.amountPaid);
  const depositCollected = parseMoney(order?.lopsideDepositPaidAmount);
  const depositTarget = quoteAmount > 0 ? Math.round(quoteAmount * 0.3 * 100) / 100 : 0;

  const needsDepositReminder =
    (status === 'accepted' || status === 'in progress') &&
    isLopsideFursuitOrder(order) &&
    depositTarget > 0 &&
    depositCollected < depositTarget;

  if (needsDepositReminder) {
    return {
      shouldSend: true,
      type: 'deposit',
      amountDue: Math.max(0, Math.round((depositTarget - depositCollected) * 100) / 100)
    };
  }

  const remainingBalance = Math.max(0, Math.round((quoteAmount - paidAmount - depositCollected) * 100) / 100);
  const eligibleFinalStatuses = new Set(['in progress', 'paid', 'finished', 'shipped']);
  const needsFinalReminder = eligibleFinalStatuses.has(status) && quoteAmount > 0 && remainingBalance > 0;

  if (needsFinalReminder) {
    return {
      shouldSend: true,
      type: 'final',
      amountDue: remainingBalance
    };
  }

  return {
    shouldSend: false,
    type: '',
    amountDue: 0
  };
}

function buildReminderEmail(order, plan) {
  const customerName = String(order?.name || 'there').trim() || 'there';
  const orderId = String(order?.orderId || '').trim() || 'Unknown';
  const amountLabel = `$${Number(plan.amountDue || 0).toFixed(2)}`;
  const typeLabel = plan.type === 'deposit' ? 'Deposit Reminder' : 'Payment Reminder';
  const subject = `Husky's Little Universe | Order ${orderId} | ${typeLabel}`;

  const text = plan.type === 'deposit'
    ? [
        `Hi ${customerName},`,
        '',
        `This is a friendly reminder for order ${orderId}.`,
        `Current deposit due: ${amountLabel}.`,
        '',
        'Once the deposit is settled, we can keep your project moving smoothly in queue.',
        '',
        "Thank you for supporting Husky's Little Universe!"
      ].join('\n')
    : [
        `Hi ${customerName},`,
        '',
        `This is a friendly payment reminder for order ${orderId}.`,
        `Current remaining balance: ${amountLabel}.`,
        '',
        'Reply when ready and we will finalize next steps.',
        '',
        "Thank you for supporting Husky's Little Universe!"
      ].join('\n');

  return { subject, text };
}

function buildMilestoneEmail(order, nextStatus) {
  const customerName = String(order?.name || 'there').trim() || 'there';
  const orderId = String(order?.orderId || '').trim() || 'Unknown';
  const statusLabel = String(nextStatus || 'Updated').trim();

  const subject = `Husky's Little Universe | Order ${orderId} | Status: ${statusLabel}`;
  const text = [
    `Hi ${customerName},`,
    '',
    `Your order ${orderId} moved to: ${statusLabel}.`,
    '',
    'You can keep tracking progress from the status page anytime.',
    '',
    "Thank you for supporting Husky's Little Universe!"
  ].join('\n');

  return { subject, text };
}

exports.sendOrderMilestoneEmail = functions.firestore
  .document('preorders/{preorderDocId}')
  .onUpdate(async (change) => {
    if (!sendgridKey) return null;

    const beforeData = change.before.data() || {};
    const afterData = change.after.data() || {};

    const beforeStatus = normalizeStatus(beforeData.status);
    const afterStatus = normalizeStatus(afterData.status);
    if (!afterStatus || beforeStatus === afterStatus) return null;

    const email = String(afterData.email || '').trim().toLowerCase();
    const orderId = String(afterData.orderId || '').trim();
    if (!email || !orderId) return null;

    const alreadySentForStatus = normalizeStatus(afterData.lastMilestoneEmailStatus) === afterStatus;
    if (alreadySentForStatus) return null;

    const milestoneEmail = buildMilestoneEmail(afterData, afterData.status || afterStatus);
    try {
      await sgMail.send({
        to: email,
        from: 'horizontidegallery@gmail.com',
        subject: milestoneEmail.subject,
        text: milestoneEmail.text
      });

      await change.after.ref.update({
        lastMilestoneEmailStatus: afterStatus,
        lastMilestoneEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Milestone email sent:', orderId, afterStatus);
    } catch (error) {
      console.error('Milestone email failed:', orderId, afterStatus, error);
    }

    return null;
  });

exports.processCustomerPaymentReminderRequest = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    if (!sendgridKey) return null;

    const data = snap.data() || {};
    const requestType = String(data.requestType || '').trim().toLowerCase();
    if (requestType !== 'customer_payment_reminder_request') return null;

    const orderId = String(data.orderId || '').trim();
    const requesterEmail = String(data.reporterEmail || '').trim().toLowerCase();
    if (!orderId || !requesterEmail) return null;

    try {
      const preorderSnapshot = await admin
        .firestore()
        .collection('preorders')
        .where('orderId', '==', orderId)
        .limit(1)
        .get();

      const order = preorderSnapshot.empty ? { orderId, name: 'there' } : (preorderSnapshot.docs[0].data() || {});
      const plan = getOrderReminderPlan(order);
      const payload = plan.shouldSend
        ? buildReminderEmail(order, plan)
        : {
            subject: `Husky's Little Universe | Order ${orderId} | Payment Snapshot`,
            text: [
              `Hi ${String(order?.name || 'there').trim() || 'there'},`,
              '',
              `We received your one-click payment reminder request for order ${orderId}.`,
              'There is no immediate payment reminder flagged right now, but your request was logged.',
              '',
              'If you still need details, reply to this email and we will follow up manually.'
            ].join('\n')
          };

      await sgMail.send({
        to: requesterEmail,
        from: 'horizontidegallery@gmail.com',
        subject: payload.subject,
        text: payload.text
      });

      await snap.ref.update({
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processingStatus: 'completed'
      });
      console.log('Processed one-click payment reminder request:', context.params.reportId, orderId);
    } catch (error) {
      await snap.ref.update({
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processingStatus: 'failed',
        processingError: String(error && error.message ? error.message : 'Unknown error').slice(0, 500)
      });
      console.error('Failed processing one-click payment reminder request:', context.params.reportId, error);
    }

    return null;
  });

exports.sendAutomatedPaymentReminders = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async () => {
    if (!sendgridKey) {
      console.warn('SendGrid key not configured; skipping automated reminders.');
      return null;
    }

    const statuses = ['Accepted', 'In Progress', 'Paid', 'Finished', 'Shipped'];
    const cooldownMs = 72 * 60 * 60 * 1000;
    const nowMs = Date.now();

    const snapshot = await admin
      .firestore()
      .collection('preorders')
      .where('status', 'in', statuses)
      .limit(120)
      .get();

    if (snapshot.empty) {
      console.log('Automated reminders: no matching preorders found.');
      return null;
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const docSnap of snapshot.docs) {
      const order = docSnap.data() || {};
      const email = String(order.email || '').trim().toLowerCase();
      const orderId = String(order.orderId || '').trim();
      if (!email || !orderId) {
        skippedCount += 1;
        continue;
      }

      const lastSentAt = order.lastReminderSentAt && typeof order.lastReminderSentAt.toDate === 'function'
        ? order.lastReminderSentAt.toDate().getTime()
        : 0;

      if (lastSentAt && (nowMs - lastSentAt) < cooldownMs) {
        skippedCount += 1;
        continue;
      }

      const plan = getOrderReminderPlan(order);
      if (!plan.shouldSend) {
        skippedCount += 1;
        continue;
      }

      const emailContent = buildReminderEmail(order, plan);
      const msg = {
        to: email,
        from: 'horizontidegallery@gmail.com',
        subject: emailContent.subject,
        text: emailContent.text
      };

      try {
        await sgMail.send(msg);
        await docSnap.ref.update({
          lastReminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
          lastReminderType: plan.type,
          lastReminderAmountDue: plan.amountDue,
          lastReminderSentBy: 'automation',
          lastReminderAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
          lastReminderAttemptStatus: 'sent',
          lastReminderAttemptError: ''
        });
        sentCount += 1;
      } catch (error) {
        const errorMessage = error && error.message ? String(error.message) : 'Unknown SendGrid error';
        await docSnap.ref.update({
          lastReminderAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
          lastReminderAttemptStatus: 'failed',
          lastReminderAttemptError: errorMessage.slice(0, 500)
        });
        console.error('Automated reminder failed for preorder:', orderId, error);
      }
    }

    console.log(`Automated reminders completed. Sent: ${sentCount}, skipped: ${skippedCount}.`);
    return null;
  });
