import { NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();
const secret = process.env.NEXTAUTH_SECRET!;
const uploadDir = path.join(process.cwd(), "public/uploads");

export async function POST(req: Request) {
  const nextReq = new NextRequest(req);
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decodedToken = await decode({
    token,
    secret,
  });

  // Ambil id dari URL
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1];

  if (!decodedToken || decodedToken.id !== id) {
    return NextResponse.json(
      { error: "Forbidden: you can only update your own profile" },
      { status: 403 }
    );
  }

  try {
    const formData = await nextReq.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const imagePath = `/uploads/${fileName}`;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { image: imagePath },
    });

    return NextResponse.json({
      message: "Image uploaded successfully",
      image: imagePath,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
