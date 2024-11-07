"use client";

import React from "react";
import idxLogo from "@/assets/images/idx-logo.png";
import { ConnectButton } from "@particle-network/connectkit";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header: React.FC = () => {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `font-medium transition ${
      pathname === path
        ? "text-[#243031] font-semibold"
        : "text-[#8a9797] hover:text-gray-600"
    }`;

  return (
    <header className="flex justify-between items-center h-20 px-8 w-full top-0 bg-[#fdfeff] shadow-md z-20">
      {/* Left Section */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center">
          <Image
            src={idxLogo}
            alt="idx-logo"
            width={100}
            height={60}
            className="mr-5"
          />
        </Link>
        <Link href="/" className={linkClass("/")}>
          Dashboard
        </Link>
        <Link href="/factory" className={linkClass("/factory")}>
          Factory
        </Link>
        <Link href="/indexes" className={linkClass("/indexes")}>
          Indexes
        </Link>
        <Link href="/profile" className={linkClass("/profile")}>
          My Profile
        </Link>
        <Link href="/faucet" className={linkClass("/faucet")}>
          Faucet
        </Link>
        <Link href="/faucetOp" className={linkClass("/faucetOp")}>
          FaucetOp
        </Link>
      </div>

      {/* Right Section */}
      <div>
        <ConnectButton />
      </div>
    </header>
  );
};

export default Header;
