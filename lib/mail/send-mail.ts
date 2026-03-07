/**
 * メール送信ユーティリティ
 *
 * 環境変数:
 * - MAIL_PROVIDER: 'resend' | 'smtp' (default: none = メール無効)
 * - RESEND_API_KEY: Resend APIキー
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS: SMTP設定
 * - MAIL_FROM: 送信元メールアドレス (default: noreply@example.com)
 */

interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

interface MailResult {
  success: boolean;
  error?: string;
}

export async function sendMail(options: MailOptions): Promise<MailResult> {
  const provider = process.env.MAIL_PROVIDER;
  if (!provider) {
    // メール機能が無効
    return { success: false, error: 'MAIL_PROVIDER not configured' };
  }

  const from = process.env.MAIL_FROM || 'noreply@example.com';
  const toList = Array.isArray(options.to) ? options.to : [options.to];

  try {
    if (provider === 'resend') {
      return await sendViaResend(from, toList, options);
    } else if (provider === 'smtp') {
      return await sendViaSMTP(from, toList, options);
    } else {
      return { success: false, error: `Unknown MAIL_PROVIDER: ${provider}` };
    }
  } catch (err) {
    console.error('Mail send error:', err);
    return { success: false, error: String(err) };
  }
}

async function sendViaResend(from: string, to: string[], options: MailOptions): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not set' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    return { success: false, error: `Resend API error ${res.status}: ${errBody}` };
  }

  return { success: true };
}

async function sendViaSMTP(from: string, to: string[], options: MailOptions): Promise<MailResult> {
  // nodemailerが必要だが、インストールされていない場合はエラー
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require('nodemailer');
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transport.sendMail({
      from,
      to: to.join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: `SMTP error: ${err}` };
  }
}

/**
 * 通知をメールで送信するヘルパー
 */
export async function sendNotificationEmail(params: {
  recipientEmail: string;
  title: string;
  message: string;
  link?: string;
}): Promise<MailResult> {
  const { recipientEmail, title, message, link } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${escapeHtml(title)}</h2>
      <p style="color: #555; line-height: 1.6;">${escapeHtml(message)}</p>
      ${link ? `<p><a href="${appUrl}${link}" style="display: inline-block; padding: 8px 16px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">詳細を確認</a></p>` : ''}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">MTT Kinton からの自動通知メールです。</p>
    </div>
  `;

  return sendMail({
    to: recipientEmail,
    subject: title,
    text: `${title}\n\n${message}${link ? `\n\n${appUrl}${link}` : ''}`,
    html,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
