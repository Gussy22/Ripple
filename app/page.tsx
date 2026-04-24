import Link from "next/link";

export default function Home() {
  const waveHeights = [3,5,8,6,9,7,4,8,5,9,6,3,7,5,8,4,6,9,5,7,4,8,6,3,9,5,7,4];

  return (
    <div className="min-h-screen bg-cream text-ink">

      {/* Navigation */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-serif italic text-xl font-medium tracking-tight text-ink">dearly</span>
        <Link
          href="/projet/nouveau"
          className="bg-ink text-cream text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-75 transition-opacity"
        >
          Créer un projet
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-center">

          {/* Copy */}
          <div>
            <p className="text-[11px] font-semibold text-clay uppercase tracking-widest mb-7">
              Livré automatiquement chaque semaine par email
            </p>
            <h1 className="font-serif text-5xl lg:text-[3.75rem] font-medium leading-[1.1] tracking-tight mb-6">
              Les voix de vos proches,{" "}
              <em className="text-clay not-italic">en podcast cadeau.</em>
            </h1>
            <p className="text-lg text-ink-muted leading-relaxed mb-10 max-w-lg">
              Organisez un podcast surprise avec les messages vocaux de la famille
              et des amis. Chaque semaine, un épisode monté automatiquement arrive
              dans la boîte mail du destinataire.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/projet/nouveau"
                className="inline-flex items-center justify-center bg-ink text-cream font-medium px-8 py-3.5 rounded-xl hover:opacity-75 transition-opacity"
              >
                Créer un podcast cadeau
              </Link>
              <a
                href="#comment"
                className="inline-flex items-center justify-center text-ink-muted text-sm font-medium px-8 py-3.5 rounded-xl border border-ink/10 hover:bg-ink/5 transition-colors"
              >
                Comment ça marche
              </a>
            </div>
            <p className="mt-4 text-xs text-ink-muted">Gratuit · Aucune application à installer</p>
          </div>

          {/* Audio player mockup */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-md border border-ink/5 p-7">

              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "oklch(93% 0.045 70)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="oklch(60% 0.13 50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] text-ink-muted mb-0.5">Épisode 2 · Pour Marie</p>
                  <p className="font-medium text-ink text-sm leading-snug">Ce souvenir que je garde précieusement</p>
                </div>
              </div>

              {/* Waveform */}
              <div className="flex items-center gap-[3px] mb-3">
                {waveHeights.map((h, i) => (
                  <div
                    key={i}
                    className="rounded-full flex-shrink-0"
                    style={{
                      width: "5px",
                      height: `${h * 4}px`,
                      backgroundColor: i < 12
                        ? "oklch(60% 0.13 50)"
                        : "oklch(88% 0.01 60)",
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-ink-muted mb-5">
                <span>1:24</span>
                <div className="flex items-center gap-4">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
                  </svg>
                  <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center">
                    <svg width="9" height="11" viewBox="0 0 10 12" fill="white">
                      <rect x="0" y="0" width="3" height="12"/>
                      <rect x="7" y="0" width="3" height="12"/>
                    </svg>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zm2-8.14 4.77 2.14L8 14.14V9.86z"/>
                    <path d="M16 6h2v12h-2z"/>
                  </svg>
                </div>
                <span>3:47</span>
              </div>

              <div className="pt-4 border-t border-ink/5 flex items-center gap-2">
                {[
                  { l: "S", bg: "oklch(76% 0.12 50)" },
                  { l: "M", bg: "oklch(66% 0.12 250)" },
                  { l: "L", bg: "oklch(68% 0.11 160)" },
                  { l: "A", bg: "oklch(68% 0.11 310)" },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: c.bg }}
                  >
                    {c.l}
                  </div>
                ))}
                <p className="text-xs text-ink-muted ml-1">Sophie, Marc et 2 autres</p>
              </div>
            </div>

            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-50 blur-2xl pointer-events-none"
              style={{ backgroundColor: "oklch(80% 0.1 70)" }}
            />
            <div
              className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-30 blur-2xl pointer-events-none"
              style={{ backgroundColor: "oklch(78% 0.08 250)" }}
            />
          </div>

        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[11px] font-semibold text-clay uppercase tracking-widest mb-3">
            Comment ça marche
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-ink text-center mb-16 tracking-tight">
            Aussi simple qu&apos;un message vocal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 relative">
            {/* Connecting line, desktop only */}
            <div className="hidden md:block absolute top-10 left-[16.666%] right-[16.666%] h-px bg-ink/8" />

            {[
              {
                num: "01",
                titre: "Vous organisez",
                desc: "Choisissez l'occasion, les titres des épisodes, invitez vos proches par email et choisissez un jingle.",
              },
              {
                num: "02",
                titre: "Ils enregistrent",
                desc: "Chaque invité reçoit un lien et enregistre son message vocal en un clic, sans inscription, depuis son téléphone.",
              },
              {
                num: "03",
                titre: "Dearly livre",
                desc: "Chaque semaine, un épisode monté automatiquement arrive dans la boîte mail du destinataire.",
              },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center px-8 pb-8 md:pb-0">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-6 relative z-10"
                  style={{ backgroundColor: "oklch(93% 0.045 70)" }}
                >
                  <span className="font-serif italic text-xl font-medium text-clay">{step.num}</span>
                </div>
                <h3 className="font-semibold text-ink text-lg mb-3">{step.titre}</h3>
                <p className="text-ink-muted text-sm leading-relaxed max-w-[260px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Les occasions */}
      <section className="py-24 px-6 bg-cream">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-[11px] font-semibold text-clay uppercase tracking-widest mb-3">
            Pour chaque moment fort
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-ink text-center mb-14 tracking-tight">
            Une occasion, un podcast unique
          </h2>

          <div className="divide-y divide-ink/6">
            {[
              { titre: "Anniversaire", desc: "Les 40 ans, les 70 ans — tous les âges méritent d'être célébrés en voix." },
              { titre: "Mariage", desc: "Un cadeau qui touche au cœur, bien après la fête." },
              { titre: "Retraite", desc: "Une carrière, des souvenirs, des voix qui disent merci." },
              { titre: "Naissance", desc: "Les premiers mots du monde pour accueillir un nouveau venu." },
              { titre: "Départ", desc: "Pour ceux qui s'en vont loin — une valise de voix familières." },
              { titre: "Autre occasion", desc: "Chaque moment qui mérite d'être gravé dans les mémoires." },
            ].map((occ) => (
              <div key={occ.titre} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between py-5 gap-1.5">
                <h3 className="font-medium text-ink text-lg">{occ.titre}</h3>
                <p className="text-sm text-ink-muted sm:text-right max-w-sm">{occ.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Citation émotionnelle */}
      <section className="bg-warm-dark py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p
            className="font-serif italic text-7xl leading-none mb-4"
            style={{ color: "oklch(60% 0.13 50)" }}
          >
            &ldquo;
          </p>
          <blockquote
            className="font-serif text-2xl md:text-3xl font-medium leading-relaxed mb-8"
            style={{ color: "oklch(92% 0.008 70)" }}
          >
            Une photo, ça montre un visage.
            <br />
            Une voix, ça rappelle une personne entière.
          </blockquote>
          <p style={{ color: "oklch(55% 0.01 60)" }} className="text-sm tracking-wide">
            L&apos;idée derrière Dearly
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-cream">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl font-medium text-ink text-center mb-12 tracking-tight">
            Questions fréquentes
          </h2>
          <div className="divide-y divide-ink/6">
            {[
              {
                q: "Les contributeurs ont-ils besoin d'un compte ?",
                r: "Non. Ils reçoivent un lien par email et enregistrent leur message en un clic, sans inscription.",
              },
              {
                q: "Comment est monté le podcast ?",
                r: "Automatiquement. Dearly assemble le jingle, les messages vocaux et les transitions — vous n'avez rien à faire.",
              },
              {
                q: "Comment le destinataire reçoit-il les épisodes ?",
                r: "Par email, chaque semaine, à la date que vous avez choisie. Il reçoit un lien pour écouter l'épisode.",
              },
              {
                q: "Puis-je uploader mon propre jingle ?",
                r: "Oui. Vous pouvez uploader votre propre fichier audio ou choisir parmi nos jingles suggérés.",
              },
            ].map((item) => (
              <div key={item.q} className="py-6">
                <p className="font-medium text-ink mb-2">{item.q}</p>
                <p className="text-ink-muted text-sm leading-relaxed">{item.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-clay py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="font-serif text-3xl md:text-4xl font-medium mb-4 tracking-tight"
            style={{ color: "oklch(97% 0.008 70)" }}
          >
            Prêt à offrir quelque chose d&apos;inoubliable ?
          </h2>
          <p className="mb-10 leading-relaxed" style={{ color: "oklch(80% 0.04 60)" }}>
            Créez votre projet en 5 minutes. Vos proches font le reste.
          </p>
          <Link
            href="/projet/nouveau"
            className="inline-block bg-white font-semibold px-10 py-4 rounded-xl hover:opacity-90 transition-opacity"
            style={{ color: "oklch(48% 0.12 48)" }}
          >
            Commencer maintenant
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/6 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-serif italic font-medium text-ink">dearly</span>
          <p className="text-xs text-ink-muted">Fait pour les moments qui comptent</p>
        </div>
      </footer>

    </div>
  );
}
