import Link from "next/link";
import Image from "next/image";

const markets = [
  {
    href: "/france",
    label: "France",
    eyebrow: "Market I / Europe",
    title: "France",
    subtitle: "Paris, DVF transactions, notaires, rental yields and renovation intelligence.",
    image: "/france/eiffel-tower-hero.jpg",
    align: "items-start text-left justify-end",
    gradient:
      "bg-[linear-gradient(90deg,rgba(5,6,10,0.58),rgba(5,6,10,0.34)_45%,rgba(5,6,10,0.72))]",
    cta: "Open France",
  },
  {
    href: "/fonatprop",
    label: "Dubai",
    eyebrow: "Market II / GCC",
    title: "Dubai",
    subtitle: "Burj Khalifa, DLD transactions, broker tools, widgets and investment analytics.",
    image: "/dubai-slides/02-burj-khalifa.jpg",
    align: "items-end text-right justify-end",
    gradient:
      "bg-[linear-gradient(270deg,rgba(5,6,10,0.58),rgba(5,6,10,0.30)_45%,rgba(5,6,10,0.72))]",
    cta: "Open Dubai",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-[100svh] bg-[#05060a] text-white">
      <section className="relative grid min-h-[100svh] grid-rows-2 overflow-hidden md:grid-cols-2 md:grid-rows-1">
        {markets.map((market) => (
          <Link
            key={market.href}
            href={market.href}
            className="group relative isolate flex min-h-[50svh] overflow-hidden p-7 outline-none md:min-h-[100svh] md:p-12 lg:p-16"
            aria-label={`Open FonatProp ${market.label}`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center grayscale transition duration-[1400ms] ease-out will-change-transform group-hover:scale-[1.09] group-hover:grayscale-0 group-hover:saturate-[1.18] group-focus-visible:scale-[1.09] group-focus-visible:grayscale-0"
              style={{ backgroundImage: `url(${market.image})` }}
            />
            <div className={`absolute inset-0 ${market.gradient} transition-opacity duration-700 group-hover:opacity-78`} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/16 via-transparent to-black/70 transition duration-700 group-hover:from-black/4 group-hover:to-black/48" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.18),transparent_34%)] opacity-0 transition duration-700 group-hover:opacity-100" />

            <div
              className={`relative z-10 flex h-full w-full flex-col ${market.align}`}
            >
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.38em] text-white/55">
                <span>{market.eyebrow}</span>
                <span className="h-px w-10 bg-white/28 transition-all duration-700 group-hover:w-20 group-hover:bg-white/70" />
              </div>

              <div className="max-w-[590px]">
                <h1 className="font-['Fraunces'] text-[clamp(4.2rem,11vw,10.5rem)] font-light leading-[0.82] tracking-[-0.08em] text-white drop-shadow-[0_18px_44px_rgba(0,0,0,0.45)]">
                  {market.title}
                </h1>
                <p className="mt-6 text-[clamp(1rem,1.5vw,1.25rem)] leading-8 text-white/68 transition duration-700 group-hover:text-white/86">
                  {market.subtitle}
                </p>
                <div className="mt-8 inline-flex items-center gap-4 border border-white/18 bg-black/18 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/72 backdrop-blur-md transition duration-500 group-hover:border-white/44 group-hover:bg-white group-hover:text-[#05060a]">
                  {market.cta}
                  <span className="transition-transform duration-500 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-[#05060a]/46 p-2 shadow-[0_28px_90px_rgba(0,0,0,0.58)] backdrop-blur-2xl md:h-36 md:w-36">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(96,165,250,0.30),transparent_40%)]" />
            <div className="absolute inset-[-1px] rounded-full border border-white/8" />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#05060a]/72">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_78%,rgba(59,130,246,0.28),transparent_34%)]" />
              <Image
                src="/brand/fonatprop-final-icon.webp"
                alt="FonatProp"
                width={120}
                height={120}
                className="relative h-full w-full scale-[1.12] rounded-full object-cover"
                priority
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center text-center drop-shadow-[0_18px_44px_rgba(0,0,0,0.7)] md:mt-5">
            <span className="font-['Fraunces'] text-2xl font-light tracking-[-0.05em] text-white md:text-4xl">
              FonatProp
            </span>
            <span className="mt-1 max-w-[220px] font-mono text-[8px] uppercase tracking-[0.32em] text-white/58 md:text-[9px]">
              AI-powered real estate intelligence
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px bg-white/14 md:inset-y-0 md:left-1/2 md:top-0 md:h-auto md:w-px" />
      </section>
    </main>
  );
}
