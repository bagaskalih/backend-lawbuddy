import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const secret = process.env.NEXTAUTH_SECRET!;
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const nextReq = new NextRequest(request);
  const token = await getToken({ req: nextReq, secret });

  console.log("Token:", nextReq.headers.get("authorization"));

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const artikels = await prisma.artikel.findMany({
      where: { authorId: token.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(artikels);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
