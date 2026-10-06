'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="section page-section"><p className="eyebrow">AURA PROPERTY</p><h1>Temporarily unavailable</h1><p className="page-intro">We’re having trouble loading this page. Please try again shortly.</p><button className="button primary" onClick={reset}>Try again</button></section>}
