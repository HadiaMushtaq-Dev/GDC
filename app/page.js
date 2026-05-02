"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  limit,
  where,
} from "firebase/firestore";

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function BrainLogo() {
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14 drop-shadow-[0_0_20px_rgba(180,142,255,0.6)]" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="brainGradient" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#d0b9ff" />
          <stop offset="50%" stopColor="#9b7cff" />
          <stop offset="100%" stopColor="#7a5cff" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* Outer brain outline */}
      import { useEffect } from "react";
      import { useRouter } from "next/navigation";
      import { useAuth } from "@/lib/auth-context";

      export default function HomePage() {
        const router = useRouter();
        const { user, loading } = useAuth();

        useEffect(() => {
          if (!loading) {
            router.replace(user ? "/dashboard" : "/login");
          }
        }, [loading, router, user]);

        return null;
      }
      <circle cx="32" cy="28" r="1.5" fill="url(#brainGradient)" opacity="1" filter="url(#glow)" />
