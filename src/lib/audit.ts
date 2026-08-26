// Canonical audit log helper (gap C6)
// One queryable log of who did what, when, on what entity.
// Replaces scattered timestamp columns across models.

import { db } from "@/lib/db";

export interface AuditEvent {
  actorId?: string;
  actorRole?: string; // victim | lawyer | admin | regulator | system
  action: string;     // e.g. "draft.generated", "case.access.granted"
  entityType?: string; // case | draft | evidence | lawyer | legal_document | user | ...
  entityId?: string;
  caseId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(event: AuditEvent): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: event.actorId ?? null,
        actorRole: event.actorRole ?? null,
        action: event.action,
        entityType: event.entityType ?? null,
        entityId: event.entityId ?? null,
        caseId: event.caseId ?? null,
        metadata: event.metadata ?? null,
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null,
      },
    });
  } catch (e) {
    // Audit logging should never break the main operation
    console.error("[audit] Failed to log event:", event.action, e);
  }
}

// Convenience methods for common actions
export const audit = {
  caseCreated: (caseId: string, userId: string) => logAudit({
    actorId: userId, actorRole: "victim", action: "case.created",
    entityType: "case", entityId: caseId, caseId,
  }),
  caseAccessGranted: (caseId: string, grantedToUserId: string, role: string, grantedBy?: string) => logAudit({
    actorId: grantedBy, actorRole: "victim", action: "case.access.granted",
    entityType: "case", entityId: caseId, caseId,
    metadata: { grantedTo: grantedToUserId, role },
  }),
  draftGenerated: (draftId: string, caseId: string | undefined, userId: string, templateType: string) => logAudit({
    actorId: userId, actorRole: "victim", action: "draft.generated",
    entityType: "draft", entityId: draftId, caseId,
    metadata: { templateType },
  }),
  draftApproved: (draftId: string, lawyerId: string, caseId?: string) => logAudit({
    actorId: lawyerId, actorRole: "lawyer", action: "draft.approved",
    entityType: "draft", entityId: draftId, caseId,
  }),
  draftRejected: (draftId: string, lawyerId: string, caseId?: string, reason?: string) => logAudit({
    actorId: lawyerId, actorRole: "lawyer", action: "draft.rejected",
    entityType: "draft", entityId: draftId, caseId,
    metadata: reason ? { reason } : undefined,
  }),
  draftSent: (draftId: string, userId: string, caseId?: string) => logAudit({
    actorId: userId, actorRole: "victim", action: "draft.sent",
    entityType: "draft", entityId: draftId, caseId,
  }),
  ragDocVerified: (docId: string, lawyerId: string, articleId?: string) => logAudit({
    actorId: lawyerId, actorRole: "lawyer", action: "rag.doc.verified",
    entityType: "legal_document", entityId: docId,
    metadata: articleId ? { articleId } : undefined,
  }),
  lawyerVerified: (lawyerId: string, adminId: string, barId: string) => logAudit({
    actorId: adminId, actorRole: "admin", action: "lawyer.verified",
    entityType: "lawyer", entityId: lawyerId,
    metadata: { barId },
  }),
  consentAccepted: (userId: string | undefined, consentType: string, version: string) => logAudit({
    actorId: userId, actorRole: "victim", action: "consent.accepted",
    entityType: "consent", metadata: { consentType, version },
  }),
  evidenceUploaded: (evidenceId: string, caseId: string, userId: string, type: string, hash?: string) => logAudit({
    actorId: userId, actorRole: "victim", action: "evidence.uploaded",
    entityType: "evidence", entityId: evidenceId, caseId,
    metadata: { type, hash },
  }),
  llmCall: (feature: string, userId: string | undefined, redactedPiiCount: number, caseId?: string) => logAudit({
    actorId: userId, actorRole: "victim", action: `llm.${feature}.called`,
    entityType: "llm_call", caseId,
    metadata: { redactedPiiCount, provider: "z-ai-web-dev-sdk" },
  }),
  dataSubjectRequest: (requestId: string, userId: string | undefined, requestType: string) => logAudit({
    actorId: userId, actorRole: "victim", action: `data_subject.${requestType}_requested`,
    entityType: "data_subject_request", entityId: requestId,
  }),
};

// Query helper for admin audit log view
export async function getRecentAuditEvents(limit = 100, filters?: {
  actorId?: string;
  action?: string;
  entityType?: string;
  caseId?: string;
}) {
  return db.auditLog.findMany({
    where: {
      ...(filters?.actorId ? { actorId: filters.actorId } : {}),
      ...(filters?.action ? { action: { contains: filters.action } } : {}),
      ...(filters?.entityType ? { entityType: filters.entityType } : {}),
      ...(filters?.caseId ? { caseId: filters.caseId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
