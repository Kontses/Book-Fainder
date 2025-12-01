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
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Book Fainder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcf9f2; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fcf9f2;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <!-- Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 1px solid #f0f0f0;">
              <!-- TODO: Replace with your actual Logo URL from Supabase Storage -->
              <img src="https://placehold.co/200x60/ffffff/a32933?text=Book+Fainder" width="200" alt="Book Fainder" style="display: block; border: 0;">
            </td>
          </tr>

          <!-- Hero Image -->
          <tr>
            <td style="padding: 0;">
              <!-- TODO: Replace with your actual Hero Image URL from Supabase Storage -->
              <img src="https://placehold.co/600x300/fcf9f2/a32933?text=Welcome+to+the+Community" width="600" style="width: 100%; max-width: 600px; height: auto; display: block;" alt="Welcome">
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; color: #2e2621;">
              <h1 style="color: #a32933; font-size: 28px; margin: 0 0 20px 0; font-weight: bold;">Welcome, ${nickname || 'Book Lover'}!</h1>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We are thrilled to have you join our community of book lovers. Book Fainder is your companion in discovering your next literary adventure.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Connect with friends, share your reading journey, and find hidden gems tailored just for you.
              </p>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://bookfainder.com" style="background-color: #a32933; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; mso-padding-alt: 0;">
                      Start Reading
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f5f0; padding: 30px; text-align: center; border-top: 1px solid #f0f0f0;">
              <p style="font-size: 12px; color: #888888; margin: 0 0 10px 0;">
                &copy; ${new Date().getFullYear()} Book Fainder. All rights reserved.
              </p>
              <p style="font-size: 12px; color: #888888; margin: 0;">
                You received this email because you signed up for Book Fainder.<br>
                <a href="https://bookfainder.com/profile/${nickname || 'user'}#settings" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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
