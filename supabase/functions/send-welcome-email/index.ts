// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import Resend from "https://esm.sh/resend@2.0.0";

// @ts-ignore
const resend = new Resend.Resend(Deno.env.get("RESEND_API_KEY"));

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

        const emailResponse = await resend.emails.send({
            from: "Book Fainder <info@bookfainder.com>",
            to: [email],
            subject: "Welcome to Book Fainder!",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Book Fainder${nickname ? `, ${nickname}` : ''}!</h1>
          <p>We're excited to have you on board.</p>
          <p>Start discovering your next favorite book today.</p>
          <br />
          <p>Best regards,</p>
          <p>The Book Fainder Team</p>
        </div>
      `,
        });

        return new Response(JSON.stringify(emailResponse), {
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
