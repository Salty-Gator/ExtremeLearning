"use client";

import { motion } from "framer-motion";
import Category2Content from "@/components/erate/Category2Content";

export default function EratePage() {
  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-2 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-center">
            <span className="text-purple-500">E‑Rate</span> Category 2 Funding Guide
          </h1>
          <p className="mt-4 text-base sm:text-lg text-default-600 text-center">
            Single‑sourced content used by the homepage modal for consistency.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          className="mt-8"
        >
          <Category2Content />
        </motion.div>
      </div>
    </section>
  );
}
