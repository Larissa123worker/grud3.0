import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select(`
        id,
        recipient_email,
        recipient_name,
        campaign_emails (
          subject,
          html_content
        ),
        campaigns:campaign_emails!inner(
          from_email:campaigns!inner(from_email)
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(50);

    if (fetchError) {
      throw new Error(`Error fetching scheduled emails: ${fetchError.message}`);
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No emails to process', processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const results = [];

    for (const email of scheduledEmails) {
      try {
        const campaignEmail = email.campaign_emails as any;
        const fromEmail = 'isa@isadate.online';

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email.recipient_email],
            subject: campaignEmail.subject,
            html: campaignEmail.html_content,
          }),
        });

        const resendData = await resendResponse.json();

        if (resendResponse.ok) {
          await supabase
            .from('scheduled_emails')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          results.push({ id: email.id, status: 'sent', resendId: resendData.id });
        } else {
          await supabase
            .from('scheduled_emails')
            .update({
              status: 'failed',
              error_message: JSON.stringify(resendData),
            })
            .eq('id', email.id);

          results.push({ id: email.id, status: 'failed', error: resendData });
        }
      } catch (emailError) {
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_message: emailError.message,
          })
          .eq('id', email.id);

        results.push({ id: email.id, status: 'failed', error: emailError.message });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Emails processed',
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing scheduled emails:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});