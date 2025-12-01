// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
import nodemailer from "npm:nodemailer@6.9.13";
// @ts-ignore
import { Buffer } from "node:buffer";
// @ts-ignore
import { Buffer } from "node:buffer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: Deno.env.get("SMTP_USER"),
        pass: Deno.env.get("SMTP_PASS"),
    },
});

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
    message: string;
    category: string;
    userId?: string;
    userEmail?: string;
    nickname?: string;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { message, category, userId, userEmail, nickname }: FeedbackRequest = await req.json();

        const info = await transporter.sendMail({
            from: '"Book Fainder Feedback" <info@bookfainder.com>',
            to: "bookfainder@gmail.com", // Admin email
            replyTo: userEmail,
            subject: `New Feedback: ${category}`,
            html: `
        <h1>New Feedback Received</h1>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr />
        <h3>User Details</h3>
        <p><strong>Nickname:</strong> ${nickname || 'Anonymous'}</p>
        <p><strong>User ID:</strong> ${userId || 'Anonymous'}</p>
        <p><strong>Email:</strong> ${userEmail || 'Not provided'}</p>
      `,
        });

        return new Response(JSON.stringify(info), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
