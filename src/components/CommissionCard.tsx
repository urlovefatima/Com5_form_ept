import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Commission } from "@/lib/types";

export default function CommissionCard({ c }: { c: Commission }) {
  return (
    <Link href={`/contribuer/${c.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-navy-900 shadow-[0_20px_40px_-24px_rgba(11,37,69,.55)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-24px_rgba(11,37,69,.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-500/30 sm:aspect-[4/5]">
      <img src={c.image} alt={c.imageAlt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.07]" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/5 to-navy-950/55" />
      <div className="absolute left-4 right-4 top-4 sm:left-5 sm:top-5">
        <h3 className="text-[15px] font-bold leading-tight text-white sm:text-lg">{c.shortName}</h3>
        <p className="mt-1 hidden text-[13px] leading-snug text-white/75 sm:block">{c.tagline}</p>
      </div>
      <span className="absolute bottom-3.5 right-3.5 grid h-10 w-10 place-items-center rounded-full bg-white/25 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-navy-900 sm:bottom-4 sm:right-4 sm:h-11 sm:w-11">
        <ArrowUpRight className="h-[18px] w-[18px] transition-transform group-hover:rotate-45" />
      </span>
    </Link>
  );
}
