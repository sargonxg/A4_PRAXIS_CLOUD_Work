import { Briefcase, Crown, HeartHandshake } from "lucide-react";

const personas = [
  {
    title: "Policy Officer",
    copy: "Brief, memo, talking points inherit your last analyst.",
    icon: Briefcase,
  },
  {
    title: "Mediator",
    copy: "Boardroom-deliberated options + ZOPA + BATNA",
    icon: HeartHandshake,
  },
  {
    title: "Analyst Lead",
    copy: "Multi-situation desks, team handoffs, audit log.",
    icon: Crown,
  },
];

export function BuiltFor() {
  return (
    <section id="built-for" className="relative overflow-hidden px-6 py-16 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cream-100 via-white to-cream-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-16 h-64 w-[min(760px,90vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_45%,rgba(218,165,32,0.16),transparent_32%),radial-gradient(circle_at_65%_55%,rgba(33,75,135,0.14),transparent_38%)] blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-4 text-center">
          <span className="mx-auto mb-5 block h-px w-16 bg-gradient-to-r from-transparent via-gold-600 to-transparent" aria-hidden="true" />
          <span className="text-overline text-gold-700">Built For</span>
        </div>
        <h2 className="mx-auto max-w-3xl text-center font-serif text-3xl text-navy-900 sm:text-4xl lg:text-5xl">
          One intelligence surface for distinct diplomatic roles.
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {personas.map((persona) => {
            const Icon = persona.icon;

            return (
              <article
                key={persona.title}
                className="group relative min-h-[220px] overflow-hidden rounded-xl border border-cream-300/70 bg-white/80 p-6 shadow-sm shadow-navy-900/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-diplomatic-blue/25 hover:shadow-lg hover:shadow-diplomatic-blue/10"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(218,165,32,0.16),transparent_34%),radial-gradient(circle_at_88%_92%,rgba(33,75,135,0.16),transparent_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div className="relative flex h-full flex-col">
                  <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-lg border border-gold-600/15 bg-gold-600/10 text-gold-700 transition-colors duration-300 group-hover:border-diplomatic-blue/15 group-hover:bg-diplomatic-blue/10 group-hover:text-diplomatic-blue">
                    <Icon
                      className="h-5 w-5 transition-transform duration-200 group-hover:-rotate-6"
                      strokeWidth={1.7}
                    />
                  </div>
                  <div className="mt-auto">
                    <h3 className="text-lg font-semibold text-navy-900">{persona.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-navy-500">{persona.copy}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
