// Event taxonomy + analytics tracking (PRD v3.2 §4.1)
// 25 event types that fire with user_id, case_id, and timestamp.
// Sent to analytics (Plausible/Matomo) as custom events AND mirrored to audit_logs
// for compliance-critical events (draft/review/access/deadline).

export type EventType =
  | "intake_started"
  | "intake_completed"
  | "calculator_started"
  | "calculator_completed"
  | "workflow_task_completed"
  | "document_uploaded"
  | "complaint_generated"
  | "complaint_sent"
  | "draft_generated"
  | "draft_submitted_for_review"
  | "draft_approved"
  | "draft_rejected"
  | "draft_sent"
  | "escalation_initiated"
  | "handoff_created"
  | "case_access_granted"
  | "case_access_revoked"
  | "case_status_changed"
  | "deadline_reminder_sent"
  | "deadline_missed"
  | "lawyer_application_submitted"
  | "lawyer_application_approved"
  | "ai_feedback_submitted"
  | "data_request_submitted"
  | "data_request_fulfilled";

// Events that must also be mirrored to audit_logs (compliance/dispute-relevant)
const AUDIT_MIRROR_EVENTS: Set<EventType> = new Set([
  "draft_generated",
  "draft_submitted_for_review",
  "draft_approved",
  "draft_rejected",
  "draft_sent",
  "case_access_granted",
  "case_access_revoked",
  "case_status_changed",
  "deadline_reminder_sent",
  "deadline_missed",
  "lawyer_application_approved",
  "data_request_fulfilled",
]);

export interface TrackEventOptions {
  event: EventType;
  userId?: string;
  caseId?: string;
  properties?: Record<string, unknown>;
}

// Track an event — sends to analytics + mirrors to audit_logs if needed
export async function trackEvent(opts: TrackEventOptions): Promise<void> {
  const { event, userId, caseId, properties = {} } = opts;

  // 1. Send to analytics (Plausible/Matomo)
  // In production, this would call the analytics provider's API.
  // For MVP, we log to console — the production deployment would wire this up.
  if (process.env.NODE_ENV === "production") {
    // Plausible custom events via server-side API
    if (process.env.PLAUSIBLE_DOMAIN) {
      try {
        await fetch("https://plausible.io/api/event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Haqqi-Server/1.0",
          },
          body: JSON.stringify({
            domain: process.env.PLAUSIBLE_DOMAIN,
            name: event,
            url: process.env.NEXTAUTH_URL ?? "https://haqqi.jo",
            props: { ...properties, user_id: userId ?? "anonymous", case_id: caseId ?? "" },
          }),
        });
      } catch (e) {
        console.error("[analytics] Failed to send event:", event, e);
      }
    }
  } else {
    // Dev mode: log to console
    console.log(`[event] ${event}`, { userId, caseId, ...properties });
  }

  // 2. Mirror compliance-critical events to audit_logs
  if (AUDIT_MIRROR_EVENTS.has(event) && userId) {
    try {
      const { audit } = await import("@/lib/audit");
      await audit.logAudit({
        actorId: userId,
        actorRole: "system",
        action: `event.${event}`,
        entityType: event.split("_")[0], // draft, case, deadline, etc.
        entityId: (properties.entityId as string) ?? undefined,
        caseId,
        metadata: properties,
      });
    } catch (e) {
      console.error("[analytics] Failed to mirror to audit_logs:", event, e);
    }
  }
}

// Convenience methods for common events
export const events = {
  intakeStarted: (userId: string, caseId: string) =>
    trackEvent({ event: "intake_started", userId, caseId }),
  intakeCompleted: (userId: string, caseId: string) =>
    trackEvent({ event: "intake_completed", userId, caseId }),
  calculatorStarted: (userId: string, caseId: string) =>
    trackEvent({ event: "calculator_started", userId, caseId }),
  calculatorCompleted: (userId: string, caseId: string, totalMin: number, totalMax: number) =>
    trackEvent({ event: "calculator_completed", userId, caseId, properties: { totalMin, totalMax } }),
  documentUploaded: (userId: string, caseId: string, docType: string) =>
    trackEvent({ event: "document_uploaded", userId, caseId, properties: { docType } }),
  draftGenerated: (userId: string, caseId: string, templateType: string, draftId: string) =>
    trackEvent({ event: "draft_generated", userId, caseId, properties: { templateType, entityId: draftId } }),
  draftSubmittedForReview: (userId: string, caseId: string, draftId: string) =>
    trackEvent({ event: "draft_submitted_for_review", userId, caseId, properties: { entityId: draftId } }),
  draftApproved: (lawyerId: string, caseId: string | undefined, draftId: string) =>
    trackEvent({ event: "draft_approved", userId: lawyerId, caseId, properties: { entityId: draftId } }),
  draftRejected: (lawyerId: string, caseId: string | undefined, draftId: string) =>
    trackEvent({ event: "draft_rejected", userId: lawyerId, caseId, properties: { entityId: draftId } }),
  draftSent: (userId: string, caseId: string | undefined, draftId: string) =>
    trackEvent({ event: "draft_sent", userId, caseId, properties: { entityId: draftId } }),
  handoffCreated: (userId: string, caseId: string, lawyerId: string) =>
    trackEvent({ event: "handoff_created", userId, caseId, properties: { lawyerId } }),
  caseAccessGranted: (grantedBy: string, caseId: string, grantedTo: string, role: string) =>
    trackEvent({ event: "case_access_granted", userId: grantedBy, caseId, properties: { grantedTo, role } }),
  caseAccessRevoked: (revokedBy: string, caseId: string, revokedUserId: string) =>
    trackEvent({ event: "case_access_revoked", userId: revokedBy, caseId, properties: { revokedUserId } }),
  caseStatusChanged: (userId: string, caseId: string, oldStatus: string, newStatus: string) =>
    trackEvent({ event: "case_status_changed", userId, caseId, properties: { oldStatus, newStatus } }),
  escalationInitiated: (userId: string, caseId: string, target: string) =>
    trackEvent({ event: "escalation_initiated", userId, caseId, properties: { target } }),
  lawyerApplicationSubmitted: (userId: string | undefined, applicationId: string) =>
    trackEvent({ event: "lawyer_application_submitted", userId, properties: { entityId: applicationId } }),
  lawyerApplicationApproved: (adminId: string, applicationId: string, lawyerId: string) =>
    trackEvent({ event: "lawyer_application_approved", userId: adminId, properties: { entityId: applicationId, lawyerId } }),
  aiFeedbackSubmitted: (userId: string | undefined, feature: string, rating: string) =>
    trackEvent({ event: "ai_feedback_submitted", userId, properties: { feature, rating } }),
  dataRequestSubmitted: (userId: string | undefined, requestId: string, requestType: string) =>
    trackEvent({ event: "data_request_submitted", userId, properties: { entityId: requestId, requestType } }),
  dataRequestFulfilled: (adminId: string, requestId: string, requestType: string) =>
    trackEvent({ event: "data_request_fulfilled", userId: adminId, properties: { entityId: requestId, requestType } }),
  deadlineReminderSent: (userId: string, caseId: string, deadlineType: string) =>
    trackEvent({ event: "deadline_reminder_sent", userId, caseId, properties: { deadlineType } }),
  deadlineMissed: (userId: string, caseId: string, deadlineType: string) =>
    trackEvent({ event: "deadline_missed", userId, caseId, properties: { deadlineType } }),
};
