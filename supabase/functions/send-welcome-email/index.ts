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

interface WelcomeEmailRequest {
    email: string;
    nickname?: string;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email, nickname }: WelcomeEmailRequest = await req.json();

        if (!email) {
            throw new Error("Email is required");
        }

        const info = await transporter.sendMail({
            from: '"Book Fainder" <info@bookfainder.com>',
            to: email,
            subject: "Welcome to Book Fainder!",
            html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
            <!-- REPLACE WITH YOUR LOGO URL -->
            <img src="https://placehold.co/200x50/png?text=Book+Fainder" alt="Book Fainder" style="max-height: 50px;">
          </div>

          <!-- Content -->
          <div style="padding: 40px 20px; color: #333333; line-height: 1.6;">
            <h1 style="color: #1a1a1a; margin-bottom: 20px; font-size: 24px;">Welcome to Book Fainder${nickname ? `, ${nickname}` : ''}!</h1>
            <p>We are thrilled to have you join our community of book lovers.</p>
            <p>Discover your next favorite book, connect with friends, and share your reading journey.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://bookfainder.com" style="background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Book Fainder</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #e0e0e0;">
            <p>&copy; ${new Date().getFullYear()} Book Fainder. All rights reserved.</p>
            <p>
              <a href="https://bookfainder.com/profile/${nickname || 'user'}#settings" style="color: #666666; text-decoration: underline;">Unsubscribe from these emails</a>
            </p>
          </div>
        </div>
      `,
        });

        console.log("Message sent: %s", info.messageId);

        return new Response(JSON.stringify(info), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Error sending welcome email:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
