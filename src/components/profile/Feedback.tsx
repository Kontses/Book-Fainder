import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { MessageSquare, Send } from "lucide-react";

interface FeedbackProps {
    nickname?: string;
}

export const Feedback = ({ nickname }: FeedbackProps) => {
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState("general");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase.functions.invoke('send-feedback', {
                body: {
                    message,
                    category,
                    userId: user?.id,
                    userEmail: user?.email,
                    nickname
                }
            });

            if (error) throw error;

            toast.success(t('feedbackSentSuccess') || "Feedback sent successfully!");
            setMessage("");
            setCategory("general");
        } catch (error) {
            console.error('Error sending feedback:', error);
            toast.error(t('feedbackError') || "Failed to send feedback");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {t('feedbackTitle') || "Send Feedback"}
                </CardTitle>
                <CardDescription>
                    {nickname ? (
                        <>
                            {t('feedbackGreeting') || 'Hi'} <span className="font-bold text-foreground">{nickname}</span>{" "}
                        </>
                    ) : ''}
                    {t('feedbackDescription') || "Help us improve Book Fainder by sharing your thoughts."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t('feedbackCategory') || "Category"}</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-full md:w-[280px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">{t('feedbackGeneral') || "General"}</SelectItem>
                                <SelectItem value="bug">{t('feedbackBug') || "Bug Report"}</SelectItem>
                                <SelectItem value="feature">{t('feedbackFeature') || "Feature Request"}</SelectItem>
                                <SelectItem value="content">{t('feedbackContent') || "Content Issue"}</SelectItem>
                                <SelectItem value="cooperation">{t('feedbackCooperation') || "Professional Cooperation"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('feedbackMessage') || "Message"}</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={(t('feedbackPlaceholder') as string) || "Tell us what you think..."}
                            required
                            className="min-h-[100px]"
                        />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        {isSubmitting ? (t('sending') || "Sending...") : (t('sendFeedback') || "Send Feedback")}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
