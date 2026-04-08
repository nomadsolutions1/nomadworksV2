"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { ProgressBar } from "./progress-bar"
import { WelcomeStep } from "./steps/welcome-step"
import { CompanyStep } from "./steps/company-step"
import { InvoiceStep } from "./steps/invoice-step"
import { TeamStep } from "./steps/team-step"
import { SiteStep } from "./steps/site-step"
import { CompleteStep } from "./steps/complete-step"
import { updateOnboardingStep } from "@/lib/actions/onboarding"

type AnyRow = Record<string, unknown>

interface OnboardingWizardProps {
  company: AnyRow | null
  firstName: string
}

export function OnboardingWizard({ company, firstName }: OnboardingWizardProps) {
  const initialStep = Math.max(1, ((company?.onboarding_step as number) || 0) + 1)
  const [step, setStep] = useState(initialStep > 6 ? 1 : initialStep)
  const [employeesCreated, setEmployeesCreated] = useState(0)
  const [siteCreated, setSiteCreated] = useState(false)

  function goTo(nextStep: number) {
    setStep(nextStep)
    updateOnboardingStep(nextStep - 1)
  }

  return (
    <div className="min-h-screen bg-muted/50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {step > 1 && step < 6 && (
            <button onClick={() => goTo(step - 1)} className="p-1.5 rounded-lg hover:bg-border text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <span className="text-lg font-semibold text-primary">NomadWorks</span>
        </div>
        <span className="text-xs text-muted-foreground/70">Schritt {step} von 6</span>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pb-6">
        <ProgressBar currentStep={step} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 pb-12 pt-4">
        {step === 1 && (
          <WelcomeStep firstName={firstName} onNext={() => goTo(2)} />
        )}
        {step === 2 && (
          <CompanyStep
            companyName={(company?.name as string) || ""}
            address={company?.address as string | null}
            taxId={company?.tax_id as string | null}
            tradeLicense={company?.trade_license as string | null}
            onNext={() => goTo(3)}
            onSkip={() => goTo(3)}
          />
        )}
        {step === 3 && (
          <InvoiceStep
            bankName={company?.bank_name as string | null}
            bankIban={company?.bank_iban as string | null}
            bankBic={company?.bank_bic as string | null}
            invoicePrefix={company?.invoice_prefix as string | null}
            taxRate={company?.default_tax_rate as number | null}
            paymentDays={company?.payment_terms_days as number | null}
            onNext={() => goTo(4)}
            onSkip={() => goTo(4)}
          />
        )}
        {step === 4 && (
          <TeamStep
            onNext={(count) => {
              setEmployeesCreated(count)
              goTo(5)
            }}
            onSkip={() => goTo(5)}
          />
        )}
        {step === 5 && (
          <SiteStep
            onNext={(created) => {
              setSiteCreated(created)
              goTo(6)
            }}
            onSkip={() => goTo(6)}
          />
        )}
        {step === 6 && (
          <CompleteStep
            companyName={(company?.name as string) || "Ihre Firma"}
            employeesCreated={employeesCreated}
            siteCreated={siteCreated}
          />
        )}
      </div>
    </div>
  )
}
