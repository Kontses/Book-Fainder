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
            <td align="center" style="padding: 40px 20px 20px 20px; background-color: #ffffff;">
              <img src="https://rrsinicayjxwazxjrtds.supabase.co/storage/v1/object/public/email-assets/logo.png" width="200" alt="Book Fainder" style="display: block; border: 0; max-width: 200px; height: auto;">
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; color: #2e2621;">
              <h1 style="color: #a32933; font-size: 28px; margin: 0 0 20px 0; font-weight: bold; text-align: center;">Welcome, ${nickname || 'Book Lover'}!</h1>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                We are so glad you signed up for our platform. You are ready to discover a world full of books and find your next favorite read.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: justify;">
                BookFainder is an intelligent book recommendation system, helping you explore thousands of book titles, discover new authors and find exactly what you are looking for with the help of Artificial Intelligence.
              </p>

              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center; font-style: italic; color: #555;">
                "Describe the book you want to read and Artificial Intelligence will search for that book for you."
              </p>

              <!-- Feature Sections -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <!-- Search Books -->
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="40" valign="top" style="padding-right: 15px;">
                          <!-- Search Icon (Magnifying Glass) -->
                          <img src="https://cdn-icons-png.flaticon.com/512/622/622669.png" width="32" height="32" alt="Search" style="display: block; opacity: 0.8;">
                        </td>
                        <td valign="top">
                          <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #2e2621;">
                            <a href="https://www.bookfainder.com/" style="text-decoration: none; color: #2e2621;">Book Search</a>
                          </h3>
                          <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.4;">
                            Easily find the book you are looking for with our advanced search system.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Personal Library -->
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="40" valign="top" style="padding-right: 15px;">
                          <!-- Library Icon (Books) -->
                          <img src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png" width="32" height="32" alt="Library" style="display: block; opacity: 0.8;">
                        </td>
                        <td valign="top">
                          <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #2e2621;">
                            <a href="https://www.bookfainder.com/profile/${nickname || 'user'}" style="text-decoration: none; color: #2e2621;">Personal Library</a>
                          </h3>
                          <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.4;">
                            Create your own lists and organize your favorite books.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Suggestions & Reviews -->
                <tr>
                  <td style="padding: 15px 0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="40" valign="top" style="padding-right: 15px;">
                          <!-- Star/Friends Icon -->
                          <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" width="32" height="32" alt="Friends" style="display: block; opacity: 0.8;">
                        </td>
                        <td valign="top">
                          <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #2e2621;">
                            <a href="https://www.bookfainder.com/profile/${nickname || 'user'}?tab=friends" style="text-decoration: none; color: #2e2621;">Exchange Ideas</a>
                          </h3>
                          <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.4;">
                            Discover new books based on your preferences and invite friends to exchange book ideas.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://bookfainder.com" style="background-color: #a32933; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; mso-padding-alt: 0; box-shadow: 0 2px 4px rgba(163, 41, 51, 0.3);">
                      Start Exploring
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
                If you have any questions, don’t hesitate to contact us. We are here to help!
              </p>
              
              <p style="margin-top: 10px; font-size: 14px; color: #2e2621; font-weight: bold; text-align: center;">
                Happy reading,<br>
                The BookFainder Team
              </p>
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
                <a href="https://www.bookfainder.com/profile/${nickname || 'user'}#settings#email_preferences" style="color: #888888; text-decoration: underline;">Unsubscribe from these emails</a>
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
