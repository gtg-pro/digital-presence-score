export type ReportBenefitBulletProps = {
  icon: string;
  label: string;
  description?: string;
};

/**
 * Two-column insight row (Key Strengths / Improvement Opportunities).
 * Layout mirrors the WhySeoMatters BenefitBullet reference.
 */
export function ReportBenefitBullet({
  icon,
  label,
  description,
}: ReportBenefitBulletProps) {
  return (
    <div className="flex items-start gap-4">
      <img
        src={icon}
        alt=""
        width={24}
        height={24}
        className="mt-0.5 size-6 shrink-0"
        aria-hidden="true"
      />
      <div className="w-full min-w-0 text-left">
        <h3 className="font-title text-[14px] leading-[1.3] font-medium text-white md:text-[16px]">
          {label}
        </h3>
        {description ? (
          <p className="mt-1 text-left font-heading text-sm leading-relaxed text-[#9EA5B3]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
