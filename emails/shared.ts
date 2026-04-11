/**
 * Gemeinsame Email-Utilities: Branding, Layout-Wrapper, Buttons.
 * Alle Templates liefern einen einfachen HTML-String (inline styles), damit sie
 * mit jedem Transaktions-Dienst (Resend, Supabase Auth Hooks, SMTP) funktionieren.
 */

export type BrandConfig = {
  productName: string
  productUrl: string
  companyName: string
  supportEmail: string
  logoText: string
}

export const DEFAULT_BRAND: BrandConfig = {
  productName: "NomadWorks",
  productUrl: "https://nomadworks.vercel.app",
  companyName: "Nomad Solutions UG (haftungsbeschränkt)",
  supportEmail: "kontakt@nomad-solutions.de",
  logoText: "NomadWorks",
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

type LayoutOptions = {
  title: string
  preheader: string
  body: string
  brand?: BrandConfig
}

/**
 * Wrapper mit Logo-Header, Body-Container und Impressum-Footer.
 * Inline-styles — keine <style>-Tags, damit möglichst viele Email-Clients
 * (Outlook, Apple Mail, Gmail App) korrekt rendern.
 */
export function layout({ title, preheader, body, brand = DEFAULT_BRAND }: LayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1c1917;">
  <span style="display:none !important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f4;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f1f0ef;">
              <div style="font-size:18px;font-weight:700;color:#1c1917;letter-spacing:-0.01em;">${escapeHtml(brand.logoText)}</div>
              <div style="font-size:12px;color:#78716c;margin-top:2px;">ERP-Software für Bauunternehmen</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-size:15px;line-height:1.6;color:#292524;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#fafaf9;border-top:1px solid #f1f0ef;font-size:12px;color:#78716c;line-height:1.5;">
              ${escapeHtml(brand.companyName)}<br />
              Fragen? <a href="mailto:${escapeHtml(brand.supportEmail)}" style="color:#1c1917;text-decoration:underline;">${escapeHtml(brand.supportEmail)}</a><br />
              <a href="${escapeHtml(brand.productUrl)}/impressum" style="color:#78716c;text-decoration:underline;">Impressum</a>
              &nbsp;·&nbsp;
              <a href="${escapeHtml(brand.productUrl)}/datenschutz" style="color:#78716c;text-decoration:underline;">Datenschutz</a>
              &nbsp;·&nbsp;
              <a href="${escapeHtml(brand.productUrl)}/agb" style="color:#78716c;text-decoration:underline;">AGB</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td style="border-radius:12px;background:#1c1917;">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px 0;">${text}</p>`
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#1c1917;letter-spacing:-0.01em;">${escapeHtml(text)}</h1>`
}

export function muted(text: string): string {
  return `<p style="margin:24px 0 0 0;font-size:13px;color:#78716c;line-height:1.5;">${text}</p>`
}
