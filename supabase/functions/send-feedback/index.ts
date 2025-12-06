import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

        const SMTP_USER = Deno.env.get("SMTP_USER");
        const SMTP_PASS = Deno.env.get("SMTP_PASS");

        if (!SMTP_USER || !SMTP_PASS) {
            throw new Error("SMTP credentials not configured");
        }

        // Use fetch to send email via Gmail SMTP API alternative (Resend, SendGrid, etc.)
        // For now, we'll use a simple approach with the Resend API if available
        // Or fall back to logging the feedback
        
        console.log("Feedback received:", {
            category,
            message,
            nickname: nickname || 'Anonymous',
            userId: userId || 'Anonymous',
            userEmail: userEmail || 'Not provided'
        });

        // TODO: Configure email service (Resend, SendGrid, etc.) for production
        // For now, just log the feedback

        return new Response(JSON.stringify({ success: true, message: "Feedback received" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
