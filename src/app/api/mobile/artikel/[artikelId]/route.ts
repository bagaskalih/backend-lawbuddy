import { decode } from "next-auth/jwt";
import { prisma } from "@/lib/db";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Authorization, Content-Type, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ artikelId: string }> }
) {
  // Access the artikelId directly from params
  const { artikelId } = await params;

  if (!artikelId) {
    return new Response(JSON.stringify({ error: "Artikel ID is required" }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const requestBody = await req.json();

    const artikel = await prisma.artikel.findUnique({
      where: { id: artikelId },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        category: true,
      },
    });

    if (!artikel) {
      return new Response(JSON.stringify({ error: "Artikel not found" }), {
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    }

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    }
    const decodedToken = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    if (!decodedToken || !decodedToken.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    }

    if (!requestBody.content) {
      return new Response(JSON.stringify({ error: "content are required" }), {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    }

    const authorId = decodedToken.id;

    const user = await prisma.user.findUnique({
      where: { id: authorId },
    });

    const comment = await prisma.comment.create({
      data: {
        authorId: authorId,
        artikelId: artikel.id,
        content: requestBody.content, // Using the parsed request body
        name: user?.name || "Anonymous", // Fallback to "Anonymous" if name is not available
      },
    });

    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching artikel:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
}
