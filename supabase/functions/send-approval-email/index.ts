// Supabase Edge Function — sends approval email to sainiboyynr@zohomail.in
// when a new company admin signs up.
// Deploy: supabase functions deploy send-approval-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PLATFORM_EMAIL = 'sainiboyynr@zohomail.in'
const APP_URL        = Deno.env.get('APP_URL') || 'https://your-app.vercel.app'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { request_id } = await req.json()

  // Init Supabase with service role key (full access)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Fetch the approval request
  const { data: req_data, error } = await supabase
    .from('admin_approval_requests')
    .select('*')
    .eq('id', request_id)
    .single()

  if (error || !req_data) {
    return new Response(JSON.stringify({ error: 'Request not found' }), { status: 404 })
  }

  const approveUrl = `${APP_URL}/approve?token=${req_data.approval_token}&action=approve`
  const rejectUrl  = `${APP_URL}/approve?token=${req_data.approval_token}&action=reject`

  const emailHTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family: -apple-system, sans-serif; background: #FAF7FC; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(135deg, #2D0845, #7B2D8B, #C0395A); padding: 28px 32px;">
      <div style="font-size: 22px; font-weight: 800; color: #fff; letter-spacing: 2px;">ESME AQL Platform</div>
      <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px;">New Company Admin Signup Request</div>
    </div>

    <div style="padding: 28px 32px;">
      <p style="font-size: 15px; color: #1E0A2E; margin: 0 0 20px;">
        A new company has requested access to the AQL Inspection Platform. Review the details below and approve or reject their request.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr style="border-bottom: 1px solid #EDE4F0;">
          <td style="padding: 10px 0; font-size: 12px; color: #A494B0; font-weight: 600; text-transform: uppercase; width: 140px;">Full Name</td>
          <td style="padding: 10px 0; font-size: 14px; color: #1E0A2E; font-weight: 600;">${req_data.full_name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #EDE4F0;">
          <td style="padding: 10px 0; font-size: 12px; color: #A494B0; font-weight: 600; text-transform: uppercase;">Email</td>
          <td style="padding: 10px 0; font-size: 14px; color: #1E0A2E;">${req_data.email}</td>
        </tr>
        <tr style="border-bottom: 1px solid #EDE4F0;">
          <td style="padding: 10px 0; font-size: 12px; color: #A494B0; font-weight: 600; text-transform: uppercase;">Company</td>
          <td style="padding: 10px 0; font-size: 14px; color: #1E0A2E; font-weight: 600;">${req_data.company_name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #EDE4F0;">
          <td style="padding: 10px 0; font-size: 12px; color: #A494B0; font-weight: 600; text-transform: uppercase;">Country</td>
          <td style="padding: 10px 0; font-size: 14px; color: #1E0A2E;">${req_data.company_country || '—'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #EDE4F0;">
          <td style="padding: 10px 0; font-size: 12px; color: #A494B0; font-weight: 600; text-transform: uppercase;">Phone</td>
          <td style="padding: 10px 0; font-size: 14px; color: #1E0A2E;">${req_data.phone || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-size: 12px; color: #A494B0; font-weight: 600; text-transform: uppercase;">Message</td>
          <td style="padding: 10px 0; font-size: 14px; color: #1E0A2E; font-style: italic;">${req_data.message || '—'}</td>
        </tr>
      </table>

      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <a href="${approveUrl}" style="flex: 1; display: block; text-align: center; padding: 14px; background: linear-gradient(135deg, #1A6B3A, #22C55E); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">
          ✅ APPROVE ACCESS
        </a>
        <a href="${rejectUrl}" style="flex: 1; display: block; text-align: center; padding: 14px; background: linear-gradient(135deg, #8C1F38, #C0395A); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">
          ❌ REJECT REQUEST
        </a>
      </div>

      <p style="font-size: 11px; color: #A494B0; text-align: center; margin: 0;">
        Requested: ${new Date(req_data.created_at).toLocaleString('en-IN')}<br/>
        This link will only work once.
      </p>
    </div>
  </div>
</body>
</html>`

  // Send via Resend (free 3000 emails/month)
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ESME AQL Platform <noreply@resend.dev>',
      to: [PLATFORM_EMAIL],
      subject: `🔔 New Admin Signup: ${req_data.full_name} — ${req_data.company_name}`,
      html: emailHTML,
    }),
  })

  if (!emailRes.ok) {
    const err = await emailRes.text()
    return new Response(JSON.stringify({ error: 'Email failed', detail: err }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
