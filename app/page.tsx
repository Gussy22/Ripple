import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[#FDFAF5] min-h-screen">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <span className="text-2xl font-bold text-gray-900 tracking-tight">dearly</span>
        <Link
          href="/projet/nouveau"
          className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gray-700 transition-colors"
        >
          Créer un projet
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-4 py-1.5 rounded-full mb-8">
          Livré automatiquement chaque semaine par email
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6 max-w-3xl mx-auto">
          Les voix de vos proches,
          <br />
          <span className="text-amber-600">en podcast cadeau.</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Organisez un podcast surprise avec les messages vocaux de la famille et des amis.
          Livré chaque semaine, automatiquement.
        </p>

        <Link
          href="/projet/nouveau"
          className="inline-block bg-gray-900 text-white text-lg font-medium px-10 py-4 rounded-2xl hover:bg-gray-700 transition-colors shadow-lg"
        >
          Créer un podcast cadeau →
        </Link>
        <p className="mt-4 text-sm text-gray-400">Gratuit · Aucune application à installer</p>

        {/* Illustration hero — faux lecteur audio */}
        <div className="mt-16 relative">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-md mx-auto text-left">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400">Épisode 2 · Pour Marie</p>
                <p className="font-semibold text-gray-800">Ce souvenir que je garde précieusement</p>
              </div>
            </div>
            {/* Fausse forme d'onde */}
            <div className="flex items-center gap-1 mb-4">
              {[3,5,8,6,9,7,4,8,5,9,6,3,7,5,8,4,6,9,5,7,4,8,6,3,9,5,7,4].map((h, i) => (
                <div
                  key={i}
                  className={`rounded-full w-1.5 ${i < 12 ? "bg-amber-400" : "bg-gray-200"}`}
                  style={{ height: `${h * 4}px` }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-5">
              <span>1:24</span>
              <div className="flex items-center gap-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><rect x="0" y="0" width="3" height="12"/><rect x="7" y="0" width="3" height="12"/></svg>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14 4.77 2.14L8 14.14V9.86z"/><path d="M16 6h2v12h-2z"/></svg>
              </div>
              <span>3:47</span>
            </div>
            {/* Contributeurs */}
            <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
              {["S","M","L","A"].map((l, i) => (
                <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white ${["bg-amber-400","bg-blue-400","bg-green-400","bg-purple-400"][i]}`}>
                  {l}
                </div>
              ))}
              <p className="text-xs text-gray-400 ml-1">Sophie, Marc et 2 autres ont participé</p>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-100 rounded-full opacity-60 blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-blue-100 rounded-full opacity-60 blur-xl" />
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Comment ça marche</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-14">
            Aussi simple qu&apos;un message vocal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                titre: "Vous organisez",
                desc: "Choisissez l'occasion, les titres des épisodes, invitez vos proches par email et uploadez un jingle.",
                couleur: "bg-amber-50",
                accent: "text-amber-600",
              },
              {
                num: "02",
                titre: "Ils enregistrent",
                desc: "Chaque invité reçoit un lien et enregistre son message vocal en un clic, depuis son téléphone ou ordinateur.",
                couleur: "bg-blue-50",
                accent: "text-blue-600",
              },
              {
                num: "03",
                titre: "Dearly livre",
                desc: "Chaque semaine, un épisode monté automatiquement — jingle, voix, transitions — arrive dans la boîte mail du destinataire.",
                couleur: "bg-green-50",
                accent: "text-green-600",
              },
            ].map((step) => (
              <div key={step.num} className={`${step.couleur} rounded-3xl p-7`}>
                <p className={`text-4xl font-bold ${step.accent} mb-4`}>{step.num}</p>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.titre}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Les occasions */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Pour chaque moment fort</p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
          Une occasion, un podcast unique
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { titre: "Anniversaire", desc: "Les 40 ans, les 70 ans, tous les âges méritent d'être célébrés en voix." },
            { titre: "Mariage", desc: "Un cadeau de mariage qui touche au cœur, bien après la fête." },
            { titre: "Retraite", desc: "Une carrière, des souvenirs, des voix qui disent merci." },
            { titre: "Naissance", desc: "Les premiers mots du monde pour accueillir un nouveau venu." },
            { titre: "Départ", desc: "Pour ceux qui s'en vont loin — une valise de voix familières." },
            { titre: "Autre occasion", desc: "Chaque moment qui mérite d'être gravé dans les mémoires." },
          ].map((occ) => (
            <div key={occ.titre} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">{occ.titre}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{occ.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Citation émotionnelle */}
      <section className="bg-gray-900 text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-6xl font-serif text-amber-400 leading-none mb-6">&ldquo;</p>
          <blockquote className="text-2xl md:text-3xl font-medium leading-relaxed mb-6">
            Une photo, ça montre un visage. Une voix, ça rappelle une personne entière.
          </blockquote>
          <p className="text-gray-400 text-sm">L&apos;idée derrière Dearly</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Questions fréquentes</h2>
        <div className="space-y-4">
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
            <div key={item.q} className="bg-white border border-gray-100 rounded-2xl p-6">
              <p className="font-semibold text-gray-900 mb-2">{item.q}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{item.r}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-amber-50 py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Prêt à offrir quelque chose d&apos;inoubliable ?
          </h2>
          <p className="text-gray-500 mb-8">
            Créez votre projet en 5 minutes. Vos proches font le reste.
          </p>
          <Link
            href="/projet/nouveau"
            className="inline-block bg-gray-900 text-white text-lg font-medium px-10 py-4 rounded-2xl hover:bg-gray-700 transition-colors"
          >
            Commencer maintenant →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-bold text-gray-900">dearly</span>
          <p className="text-xs text-gray-400">Fait pour les moments qui comptent</p>
        </div>
      </footer>

    </div>
  );
}
