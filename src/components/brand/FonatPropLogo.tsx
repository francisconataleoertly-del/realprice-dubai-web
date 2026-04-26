import Image from "next/image";

const LOGOS = {
  lockup: {
    src: "/brand/fonatprop-logo-lockup.webp",
    width: 1260,
    height: 471,
    alt: "FonatProp - AI-powered real estate intelligence",
  },
  nav: {
    src: "/brand/fonatprop-logo-nav.webp",
    width: 1000,
    height: 303,
    alt: "FonatProp",
  },
  mark: {
    src: "/brand/fonatprop-mark.webp",
    width: 512,
    height: 512,
    alt: "FonatProp mark",
  },
};

export default function FonatPropLogo({
  variant = "lockup",
  className = "",
  imageClassName = "",
  priority = false,
}: {
  variant?: keyof typeof LOGOS;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  const logo = LOGOS[variant];

  return (
    <span className={`relative inline-flex overflow-hidden ${className}`}>
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        priority={priority}
        sizes={variant === "mark" ? "64px" : "(max-width: 768px) 220px, 420px"}
        className={`h-full w-full object-contain ${imageClassName}`}
      />
    </span>
  );
}
