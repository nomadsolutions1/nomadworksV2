/**
 * Email-Templates für NomadWorks. Alle Templates liefern { subject, html }.
 *
 * Verwendung (Beispiel mit Resend oder Supabase SMTP):
 *   import { welcomeEmail } from "@/emails"
 *   const { subject, html } = welcomeEmail({ firstName, companyName, dashboardUrl })
 *   await send({ to, subject, html })
 */

export { DEFAULT_BRAND, type BrandConfig } from "./shared"
export { invitationEmail, type InvitationEmailInput } from "./invitation"
export { trialExpiringEmail, type TrialExpiringEmailInput } from "./trial-expiring"
export { paymentFailedEmail, type PaymentFailedEmailInput } from "./payment-failed"
export { passwordResetEmail, type PasswordResetEmailInput } from "./password-reset"
export { welcomeEmail, type WelcomeEmailInput } from "./welcome"
