import Link from "next/link";

const markets = [
  {
    href: "/france",
    label: "France",
    eyebrow: "Market I",
    title: "France",
    subtitle: "DVF, notaires, rental yields and renovation intelligence.",
    image: "/france/eiffel-tower-hero.jpg",
    align: "items-start text-left",
  },
  {
    href: "/fonatprop",
    label: "Dubai",
    eyebrow: "Market II",
    title: "Dubai",
    subtitle: "DLD transactions, broker tools, widget leads and investment analytics.",
    image: "/dubai-hero.jpg",
    align: "items-end text-right",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-[100svh] bg-[#05060a] text-white">
      <section className="grid min-h-[100svh] grid-rows-2 overflow-hidden md:grid-cols-2 md:grid-rows-1">
        {markets.map((market) => (
          <Link
            key={market.href}
            href={market.href}
            className="group relative isolate flex min-h-[50svh] overflow-hidden p-7 outline-none md:min-h-[100svh] md:p-12 lg:p-16"
            aria-label={`Open FonatProp ${market.label}`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center grayscale transition duration-[1400ms] ease-out group-hover:scale-[1.075] group-hover:grayscale-0 group-hover:saturate-[1.12] group-focus-visible:scale-[1.075] group-focus-visible:grayscale-0"
              style={{ backgroundImage: `url(${market.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/34 to-black/72 transition duration-700 group-hover:from-black/6 group-hover:via-black/18 group-hover:to-black/54" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.14),transparent_32%)] opacity-0 transition duration-700 group-hover:opacity-100" />
            <div className="absolute inset-y-0 right-0 hidden w-px bg-white/12 md:block" />

            <div
              className={`relative z-10 flex h-full w-full flex-col justify-between ${market.align}`}
            >
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.38em] text-white/55">
                <span>{market.eyebrow}</span>
                <span className="h-px w-10 bg-white/28 transition-all duration-700 group-hover:w-20 group-hover:bg-white/70" />
              </div>

              <div className="max-w-[560px]">
                <h1 className="font-['Fraunces'] text-[clamp(4.2rem,11vw,10.5rem)] font-light leading-[0.82] tracking-[-0.08em] text-white drop-shadow-[0_18px_44px_rgba(0,0,0,0.45)]">
                  {market.title}
                </h1>
                <p className="mt-6 text-[clamp(1rem,1.5vw,1.25rem)] leading-8 text-white/68 transition duration-700 group-hover:text-white/86">
                  {market.subtitle}
                </p>
                <div className="mt-8 inline-flex items-center gap-4 border border-white/18 bg-black/18 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/72 backdrop-blur-md transition duration-500 group-hover:border-white/44 group-hover:bg-white group-hover:text-[#05060a]">
                  Enter market
                  <span className="transition-transform duration-500 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
