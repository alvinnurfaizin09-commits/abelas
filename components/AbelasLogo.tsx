"use client";

import React from "react";

interface AbelasLogoProps {
  variant?: "horizontal" | "square" | "dark";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function AbelasLogo({
  variant = "horizontal",
  size = "md",
  className = "",
}: AbelasLogoProps) {
  let src = "/logo-light.jpg";
  let alt = "abelas - Absensi Kelas Berbasis QR";
  let heightClass = "h-8";

  if (variant === "dark") {
    src = "/logo-dark.jpg";
  } else if (variant === "square") {
    src = "/logo-square.jpg";
  }

  if (variant === "square") {
    switch (size) {
      case "xs":
        heightClass = "h-12 w-12";
        break;
      case "sm":
        heightClass = "h-16 w-16";
        break;
      case "md":
        heightClass = "h-20 w-20";
        break;
      case "lg":
        heightClass = "h-28 w-28";
        break;
      case "xl":
        heightClass = "h-36 w-36";
        break;
    }
  } else {
    // Horizontal variants
    switch (size) {
      case "xs":
        heightClass = "h-6";
        break;
      case "sm":
        heightClass = "h-7";
        break;
      case "md":
        heightClass = "h-9";
        break;
      case "lg":
        heightClass = "h-11";
        break;
      case "xl":
        heightClass = "h-14";
        break;
    }
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`${heightClass} w-auto object-contain select-none`}
        loading="eager"
      />
    </div>
  );
}
