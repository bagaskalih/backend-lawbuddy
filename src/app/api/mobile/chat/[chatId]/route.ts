import { prisma } from "@/lib/db";
import { decode } from "next-auth/jwt";

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> })
{
    // Access the chatId directly from params
    const { chatId } = await params;
    
    if (!chatId) {
        return new Response(JSON.stringify({ error: "Chat ID is required" }), {
        status: 400,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
        },
        });
    }
    
    try {
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
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
            return new Response(JSON.stringify({ error: "Chat not found" }), {
                status: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                },
            });
        }
    
        return new Response(JSON.stringify(chat), {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        console.error("Error fetching chat:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
        },
        });
    }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> })
{
    // Access the chatId directly from params
    const { chatId } = await params;
    
    if (!chatId) {
        return new Response(JSON.stringify({ error: "Chat ID is required" }), {
        status: 400,
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
    
    try {
        const requestBody = await req.json();
        
        const message = await prisma.message.create({
            data: {
                content: requestBody.content,
                chatId: chatId,
                senderId: senderId,
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                senderId: true,
            },
        });
    
        return new Response(JSON.stringify(message), {
        status: 201,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
        },
        });
    } catch (error) {
        console.error("Error creating message:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
        },
        });
    }
}