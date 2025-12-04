import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const WelcomeEmailHandler = () => {
    useEffect(() => {
        console.log('[WelcomeEmailHandler] Mounted and listening for auth changes');

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[WelcomeEmailHandler] Event: ${event}`);

            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
                const user = session.user;
                const createdAt = new Date(user.created_at).getTime();
                const now = new Date().getTime();
                const isNewUser = (now - createdAt) < 60000; // 60 seconds threshold

                // Check if we already sent it locally to avoid double sends in this session
                const hasSentKey = `welcome_email_sent_${user.id}`;
                const hasSent = localStorage.getItem(hasSentKey);

                console.log('[WelcomeEmailHandler] Check:', {
                    createdAt,
                    now,
                    diff: now - createdAt,
                    isNewUser,
                    hasSent
                });

                if (isNewUser && !hasSent) {
                    console.log('[WelcomeEmailHandler] New user detected! Sending email...');
                    toast.info("Sending welcome email...");

                    try {
                        // Mark as sent immediately to prevent race conditions
                        localStorage.setItem(hasSentKey, 'true');

                        const { error } = await supabase.functions.invoke('send-welcome-email', {
                            body: {
                                email: user.email,
                                nickname: user.user_metadata?.full_name || user.user_metadata?.name // Try to get name from metadata
                            }
                        });

                        if (error) {
                            console.error('[WelcomeEmailHandler] Invoke error:', error);
                            // If failed, maybe un-set the flag so they can try again? 
                            // Or just leave it to avoid spamming errors.
                            throw error;
                        }

                        console.log('[WelcomeEmailHandler] Email sent successfully');
                        toast.success("Welcome email sent!");
                    } catch (err: any) {
                        console.error('[WelcomeEmailHandler] Failed to send:', err);
                        toast.error("Failed to send welcome email");
                        // Optional: localStorage.removeItem(hasSentKey); // Retry?
                    }
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return null; // This component renders nothing
};
