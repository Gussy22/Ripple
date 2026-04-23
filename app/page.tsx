import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      {/* Logo / Nom */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-3">
          dearly
        </h1>
        <p className="text-xl text-gray-500 max-w-md">
          Offrez un podcast fait de vraies voix à quelqu&apos;un qui compte.
        </p>
      </div>

      {/* Explication courte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mb-14 text-center">
        <div className="p-6 rounded-2xl bg-gray-50">
          <div className="text-3xl mb-3">🎙️</div>
          <h3 className="font-semibold text-gray-800 mb-1">Vos proches enregistrent</h3>
          <p className="text-sm text-gray-500">Un lien, un clic, une voix. Depuis leur téléphone ou ordinateur.</p>
        </div>
        <div className="p-6 rounded-2xl bg-gray-50">
          <div className="text-3xl mb-3">✨</div>
          <h3 className="font-semibold text-gray-800 mb-1">Dearly monte le podcast</h3>
          <p className="text-sm text-gray-500">Jingle, voix, transitions — tout est assemblé automatiquement.</p>
        </div>
        <div className="p-6 rounded-2xl bg-gray-50">
          <div className="text-3xl mb-3">📬</div>
          <h3 className="font-semibold text-gray-800 mb-1">Livré chaque semaine</h3>
          <p className="text-sm text-gray-500">Un épisode par email, chaque semaine, avec un mot personnalisé.</p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/projet/nouveau"
        className="bg-gray-900 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:bg-gray-700 transition-colors"
      >
        Créer un projet →
      </Link>

      <p className="mt-6 text-sm text-gray-400">
        Gratuit · Aucun compte requis pour les contributeurs
      </p>
    </main>
  );
}
