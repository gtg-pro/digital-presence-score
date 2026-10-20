export type AuditEntryMode = "url" | "minimal";

export type AuditFormValues = {
  entryMode: AuditEntryMode;
  websiteUrl: string;
  businessName: string;
  industry: string;
  serviceDeliveryModel: string;
  primaryServiceArea: string;
  remoteOnly: boolean;
  primaryConversionGoal: string;
  googleBusinessProfileUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  otherProfileUrl: string;
  email: string;
  agreeToTerms: boolean;
  receiveReportByEmail: boolean;
  marketingUpdates: boolean;
};

export type AuditFormErrors = Partial<
  Record<keyof AuditFormValues | "profiles" | "form", string>
>;

export type AuditFormFieldProps = {
  values: AuditFormValues;
  errors: AuditFormErrors;
  onChange: <K extends keyof AuditFormValues>(
    field: K,
    value: AuditFormValues[K],
  ) => void;
};

export const initialAuditFormValues = (
  websiteUrl = "",
): AuditFormValues => ({
  entryMode: "url",
  websiteUrl,
  businessName: "",
  industry: "",
  serviceDeliveryModel: "",
  primaryServiceArea: "",
  remoteOnly: false,
  primaryConversionGoal: "",
  googleBusinessProfileUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  otherProfileUrl: "",
  email: "",
  agreeToTerms: false,
  receiveReportByEmail: false,
  marketingUpdates: false,
});
