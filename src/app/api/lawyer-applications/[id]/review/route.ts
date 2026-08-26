// POST /api/lawyer-applications/[id]/review — admin approve/reject (v3.2 §5.5)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, parseJsonField } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { events } from "@/lib/events";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, rejectionReason } = body as { action: "approve" | "reject"; rejectionReason?: string };

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const application = await db.lawyerApplication.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: "application not found" }, { status: 404 });
  if (application.status !== "pending") {
    return NextResponse.json({ error: `application already ${application.status}` }, { status: 400 });
  }

  const adminUser = await db.user.findFirst({ where: { role: "admin" } });
  const adminId = adminUser?.id ?? "system";

  if (action === "approve") {
    // Create the lawyer record from the application
    const lawyer = await db.lawyer.create({
      data: {
        name: application.applicantName,
        firm: application.firm,
        location: application.location,
        languages: application.languages,
        feeModel: null,
        expertise: application.expertise,
        contactEmail: application.applicantEmail,
        contactPhone: null,
        isVerified: true,
        isLegalReviewer: false,
      },
    });

    // Mark application as approved
    const updated = await db.lawyerApplication.update({
      where: { id },
      data: {
        status: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        resultingLawyerId: lawyer.id,
      },
    });

    await audit.lawyerVerified(lawyer.id, adminId, application.barLicenseNumber);
    await events.lawyerApplicationApproved(adminId, id, lawyer.id);

    return NextResponse.json({ application: safeJson(updated), lawyer: safeJson(lawyer) });
  } else {
    // Reject
    const updated = await db.lawyerApplication.update({
      where: { id },
      data: {
        status: "rejected",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: rejectionReason ?? null,
      },
    });

    return NextResponse.json({ application: safeJson(updated) });
  }
}
