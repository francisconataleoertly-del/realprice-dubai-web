"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

// Standardised scroll-reveal wrapper used across FonatProp surfaces.
// Stagger-friendly: a parent <RevealOnScroll group> reveals children with a
// small delay so cards feel choreographed instead of popping in at once.
//
// Usage:
//   <RevealOnScroll>
//     <Card />
//   </RevealOnScroll>
//
// Or grouped:
//   <RevealOnScroll group className="grid">
//     {items.map(...) => <RevealOnScroll item key={i}>...</RevealOnScroll>}
//   </RevealOnScroll>

type Props = {
  children: ReactNode;
  group?: boolean; // parent that staggers children
  item?: boolean; // child of a group
  delay?: number;
  distance?: number; // px to translate from
  className?: string;
  as?: "div" | "section" | "article" | "ul" | "li";
};

const groupVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = (distance: number, delay: number): Variants => ({
  hidden: { opacity: 0, y: distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay,
      ease: [0.22, 1, 0.36, 1],
    },
  },
});

export default function RevealOnScroll({
  children,
  group = false,
  item = false,
  delay = 0,
  distance = 24,
  className = "",
  as = "div",
}: Props) {
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  if (group) {
    return (
      <MotionTag
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-12%" }}
        variants={groupVariants}
        className={className}
      >
        {children}
      </MotionTag>
    );
  }

  if (item) {
    return (
      <MotionTag variants={itemVariants(distance, delay)} className={className}>
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
