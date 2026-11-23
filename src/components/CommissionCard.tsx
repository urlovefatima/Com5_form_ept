import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Commission } from "@/lib/types";

export default function CommissionCard({ c, index, featured = false }: { c: Commission; index: number; featured?: boolean }) {
  return (
    <Link
      href={`/contribuer/${c.slug}`}
      className={`group card relative flex h-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-25px_rgba(11,37,69,.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-500/25 ${featured ? "lg:flex-row" : ""}`}
    >
      <div className={`relative overflow-hidden bg-navy-900 ${featured ? "aspect-[16/10] lg:aspect-auto lg:w-[55%]" : "aspect-[4/3]"}`}>
        <img src={c.image} alt={c.imageAlt} loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/75 via-navy-950/10 to-transparent" />
        <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold tracking-wider text-navy-900 backdrop-blur">
          {featured ? "COORDINATION" : `0${index}`}
        </span>
        <p className="absolute bottom-4 left-5 right-5 font-display text-lg italic text-white/95">{c.tagline}</p>
      </div>
      <div className={`flex flex-1 flex-col p-6 sm:p-7 ${featured ? "lg:justify-center lg:p-10" : ""}`}>
        <h3 className={`font-display font-semibold tracking-tight text-navy-900 ${featured ? "text-3xl" : "text-[1.45rem]"}`}>{c.name}</h3>
        <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-muted">{c.description}</p>
        <span className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-sky-100 px-5 py-2.5 text-sm font-semibold text-navy-900 transition-all duration-300 group-hover:bg-navy-900 group-hover:text-white">
          Proposer une idée
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
