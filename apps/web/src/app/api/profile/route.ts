import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err: any) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    // Whitelist profile update fields
    const {
      name,
      avatarUrl,
      linkedinUrl,
      portfolioUrl,
      targetRoles,
      preferredLocs,
      salaryMin,
      salaryMax,
      workTypes,
      skills,
      experienceLvl,
    } = body;

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(portfolioUrl !== undefined && { portfolioUrl }),
        ...(targetRoles !== undefined && { targetRoles }),
        ...(preferredLocs !== undefined && { preferredLocs }),
        ...(salaryMin !== undefined && { salaryMin: salaryMin ? parseInt(salaryMin) : null }),
        ...(salaryMax !== undefined && { salaryMax: salaryMax ? parseInt(salaryMax) : null }),
        ...(workTypes !== undefined && { workTypes }),
        ...(skills !== undefined && { skills }),
        ...(experienceLvl !== undefined && { experienceLvl }),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err: any) {
    console.error("PUT /api/profile error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
