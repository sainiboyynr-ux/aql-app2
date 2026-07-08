// Supabase Edge Function — handles approve/reject click from email link
// Deploy: supabase functions deploy handle-approval

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APP_URL = Deno.env.get('APP_URL') || 'https://your-app.vercel.app'

serve(async (req) => {
  const url    = new URL(req.url)
  const token  = url.searchParams.get('token')
  const action = url.searchParams.get('action') // 'approve' | 'reject'

  if (!token || !action) {
    return new Response('Invalid link.', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Find request by token
  const { data: reqData, error } = await supabase
    .from('admin_approval_requests')
    .select('*')
    .eq('approval_token', token)
    .single()

  if (error || !reqData) {
    return htmlResponse('❌ Invalid or expired link.', '#C0395A', 'This approval link is not valid or has already been used.')
  }

  if (reqData.status !== 'pending') {
    return htmlResponse(
      reqData.status === 'approved' ? '✅ Already Approved' : '❌ Already Rejected',
      reqData.status === 'approved' ? '#1A6B3A' : '#C0395A',
      `This request was already ${reqData.status}.`
    )
  }

  if (action === 'approve') {
    // 1. Create company
    const { data: company } = await supabase
      .from('companies')
      .insert([{
        name:          reqData.company_name,
        country:       reqData.company_country,
        contact_email: reqData.email,
        contact_phone: reqData.phone,
        is_active:     true,
      }])
      .select().single()

    // 2. Activate profile + assign company
    await supabase.from('profiles').update({
      status:     'active',
      role:       'company_admin',
      company_id: company.id,
      full_name:  reqData.full_name,
    }).eq('id', reqData.user_id)

    // 3. Mark request approved
    await supabase.from('admin_approval_requests').update({
      status:      'approved',
      reviewed_at: new Date().toISOString(),
    }).eq('id', reqData.id)

    // 4. Send approval notification email to the user via Resend
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ESME AQL Platform <noreply@resend.dev>',
        to:   [reqData.email],
        subject: '✅ Your AQL Platform Access has been Approved!',
        html: approvedEmailHTML(reqData.full_name, reqData.company_name, APP_URL),
      }),
    })

    return htmlResponse(
      '✅ Access Approved!',
      '#1A6B3A',
      `${reqData.full_name} from ${reqData.company_name} has been approved. They can now log in and set up their company profile.`
    )

  } else {
    // Reject
    await supabase.from('profiles').update({ status: 'suspended' }).eq('id', reqData.user_id)
    await supabase.from('admin_approval_requests').update({
      status:      'rejected',
      reviewed_at: new Date().toISOString(),
    }).eq('id', reqData.id)

    // Notify user of rejection
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ESME AQL Platform <noreply@resend.dev>',
        to:   [reqData.email],
        subject: 'Update on your AQL Platform Access Request',
        html: rejectedEmailHTML(reqData.full_name, reqData.company_name),
      }),
    })

    return htmlResponse('❌ Request Rejected', '#C0395A', `${reqData.full_name}'s request has been rejected and they have been notified.`)
  }
})

function htmlResponse(title: string, color: string, message: string) {
  return new Response(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${title}</title></head>
<body style="font-family:-apple-system,sans-serif;background:#FAF7FC;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
  <div style="background:#fff;border-radius:20px;padding:40px 48px;max-width:480px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.1)">
    <div style="font-size:48px;margin-bottom:16px">${title.split(' ')[0]}</div>
    <div style="font-size:22px;font-weight:800;color:${color};margin-bottom:12px">${title.replace(/^[^ ]+ /,'')}</div>
    <div style="font-size:14px;color:#6B5878;line-height:1.6">${message}</div>
    <div style="margin-top:28px;font-size:12px;color:#A494B0">ESME AQL Inspection Platform</div>
  </div>
</body></html>`, {
    headers: { 'Content-Type': 'text/html' },
  })
}

function approvedEmailHTML(name: string, company: string, appUrl: string) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#FAF7FC;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#2D0845,#7B2D8B,#C0395A);padding:28px 32px">
      <div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:2px">ESME AQL Platform</div>
    </div>
    <div style="padding:28px 32px">
      <div style="font-size:36px;text-align:center;margin-bottom:12px">🎉</div>
      <h2 style="text-align:center;color:#1A6B3A;margin:0 0 16px">Access Approved!</h2>
      <p style="color:#1E0A2E;font-size:14px;line-height:1.7">Dear ${name},<br/><br/>
      Your company <strong>${company}</strong> has been approved to use the ESME AQL Inspection Platform.<br/><br/>
      You can now log in and:<br/>
      ✅ Set up your company profile<br/>
      ✅ Add team members (QA Managers & Executives)<br/>
      ✅ Start conducting AQL inspections per ISO 2859-1</p>
      <a href="${appUrl}" style="display:block;text-align:center;margin:24px 0;padding:14px;background:linear-gradient(135deg,#7B2D8B,#C0395A);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px">
        Login to ESME AQL Platform →
      </a>
      <p style="font-size:11px;color:#A494B0;text-align:center">For support contact: sainiboyynr@zohomail.in</p>
    </div>
  </div></body></html>`
}

function rejectedEmailHTML(name: string, company: string) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#FAF7FC;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#2D0845,#7B2D8B,#C0395A);padding:28px 32px">
      <div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:2px">ESME AQL Platform</div>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#1E0A2E;font-size:14px;line-height:1.7">Dear ${name},<br/><br/>
      Thank you for your interest in the ESME AQL Platform for <strong>${company}</strong>.<br/><br/>
      After review, we are unable to approve your access request at this time.<br/><br/>
      If you believe this is an error or would like more information, please contact us at:<br/>
      <a href="mailto:sainiboyynr@zohomail.in" style="color:#7B2D8B">sainiboyynr@zohomail.in</a></p>
    </div>
  </div></body></html>`
}
