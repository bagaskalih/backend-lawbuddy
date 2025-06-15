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

export async function POST(req: Request) {
  // Access the chatId directly from params
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
  const { receiverId } = await req.json();

  if (!decodedToken || !decodedToken.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
  const senderId = decodedToken.id;
  if (!receiverId) {
    return new Response(JSON.stringify({ error: "Receiver ID is required" }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  const chat = await prisma.chat.findFirst({
    where: { senderId: senderId, receiverId: receiverId },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
        },
      },
    },
  });

  if (!chat) {
    const newChat = await prisma.chat.create({
      data: {
        senderId: senderId,
        receiverId: receiverId,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
    });
    return new Response(JSON.stringify(newChat), {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } else {
    return new Response(JSON.stringify(chat), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

}

export async function GET(req: Request) {
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

  const senderId = decodedToken.id;
  if (!senderId) {
    return new Response(JSON.stringify({ error: "Sender ID is required" }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  const chats = await prisma.chat.findMany({
    where: {
      OR: [
        { senderId: senderId },
        { receiverId: senderId }
      ]
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
        },
      },
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return new Response(JSON.stringify(chats), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });
}