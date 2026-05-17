import Link from 'next/link';
import * as React from 'react';

export default function NotFound() {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center">
      <h1 className="text-[10rem] font-bold">
        <span className="text-main-black">4</span>
        <span className="text-main-red">0</span>
        <span className="text-main-gold">4</span>
      </h1>
      <h2 className="text-xl font-bold">Diese Seite gibt es leider nicht.</h2>
      <Link href="/" className="btn-primary mt-12">
        Zurück
      </Link>
    </div>
  );
}
