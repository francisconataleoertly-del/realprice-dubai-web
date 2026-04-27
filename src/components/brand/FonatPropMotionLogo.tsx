export default function FonatPropMotionLogo({
  className = "",
  videoClassName = "",
  priority = false,
}: {
  className?: string;
  videoClassName?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`relative inline-flex overflow-hidden rounded-[26px] border border-white/10 bg-[#010814] shadow-[0_26px_90px_rgba(0,0,0,0.42)] ${className}`}
    >
      <video
        className={`h-full w-full object-cover ${videoClassName}`}
        autoPlay
        muted
        loop
        playsInline
        preload={priority ? "auto" : "metadata"}
        poster="/brand/fonatprop-logo-motion-poster.jpg"
      >
        <source src="/brand/fonatprop-logo-motion.mp4" type="video/mp4" />
      </video>
    </span>
  );
}
