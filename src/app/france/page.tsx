import Link from "next/link";

export default function FrancePage() {
  return (
    <main className="min-h-[100svh] bg-[#07080c] text-white">
      <section className="relative flex min-h-[100svh] items-center overflow-hidden px-6 py-28 md:px-12 lg:px-20">
        <div
          className="absolute inset-0 bg-cover bg-center grayscale"
          style={{ backgroundImage: "url('/france/paris-eiffel-city.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080c]/86 via-[#07080c]/54 to-[#07080c]/24" />
        <div className="relative z-10 max-w-4xl">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.38em] text-white/42">
            FonatProp / France Intelligence
          </p>
          <h1 className="font-['Fraunces'] text-[clamp(3.6rem,9vw,9rem)] font-light leading-[0.88] tracking-[-0.07em]">
            France is next.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-9 text-white/68">
            This market will stay separate from Dubai: different data, different models,
            different compliance. The entry point is ready while the France engine is prepared.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/"
              className="bg-white px-7 py-4 font-mono text-[11px] uppercase tracking-[0.26em] text-[#07080c] transition hover:bg-white/88"
            >
              Back to markets
            </Link>
            <Link
              href="/fonatprop"
              className="border border-white/18 px-7 py-4 font-mono text-[11px] uppercase tracking-[0.26em] text-white/72 transition hover:border-white/40 hover:text-white"
            >
              Open Dubai
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
