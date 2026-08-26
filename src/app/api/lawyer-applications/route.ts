// GET /api/lawyer-applications — admin: list applications
// POST /api/lawyer-applications — submit a lawyer verification application (v3.2 §5.5)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";
import { events } from "@/lib/events";

export async function GET() {
  const applications = await db.lawyerApplication.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ applications: safeJson(applications) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    applicantName, applicantEmail, barLicenseNumber, licenseDocumentUrl,
    firm, location, languages, expertise,
  } = body;

  if (!applicantName || !barLicenseNumber || !licenseDocumentUrl) {
    return NextResponse.json({
      error: "applicantName, barLicenseNumber, and licenseDocumentUrl required",
    }, { status: 400 });
  }

  const user = await getDemoUser();

  const application = await db.lawyerApplication.create({
    data: {
      applicantUserId: user.id,
      applicantName,
      applicantEmail: applicantEmail ?? user.email ?? null,
      barLicenseNumber,
      licenseDocumentUrl,
      firm: firm ?? null,
      location: location ?? null,
      languages: JSON.stringify(languages ?? ["ar"]),
      expertise: JSON.stringify(expertise ?? []),
      status: "pending",
    },
  });

  await events.lawyerApplicationSubmitted(user.id, application.id);

  return NextResponse.json({ application: safeJson(application) });
}
