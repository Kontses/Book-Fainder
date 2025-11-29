// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { Resend } from "npm:resend@2.0.0";

// @ts-ignore
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
    message: string;
    category: string;
    rating?: number;
    userId?: string;
    userEmail?: string;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { message, category, rating, userId, userEmail }: FeedbackRequest = await req.json();

        const emailResponse = await resend.emails.send({
            from: "Book Fainder <onboarding@resend.dev>",
            to: ["tasos.tse@gmail.com"], // Replace with admin email or env var
            subject: `New Feedback: ${category}`,
            html: `
        <h1>New Feedback Received</h1>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        ${rating ? `<p><strong>Rating:</strong> ${rating}/5</p>` : ''}
        <hr />
        <h3>User Details</h3>
        <p><strong>User ID:</strong> ${userId || 'Anonymous'}</p>
        <p><strong>Email:</strong> ${userEmail || 'Not provided'}</p>
      `,
        });

        return new Response(JSON.stringify(emailResponse), {
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
