import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Shield, Heart, Award } from "lucide-react";

export function AboutPage() {
  return (
    <main className="about-page">
      <div className="about-hero reveal-up">
        <small>OUR STORY</small>
        <h1>
          Made to be<br />
          <i>yours.</i>
        </h1>
        <p>
          Aurelia Jewels is an independent jewelry house born from the belief that everyday pieces should feel exceptional.
          We unite timeless craftsmanship with modern, lightweight silhouettes designed to be lived in.
        </p>
        <Link className="button dark" to="/shop">
          EXPLORE THE COLLECTION
        </Link>
      </div>

      <section className="about-values reveal-stagger">
        <div className="value-card">
          <Sparkles size={28} />
          <h3>Ethical Sourcing</h3>
          <p>We work exclusively with certified suppliers to source recycled metals and responsibly harvested gemstones.</p>
        </div>
        <div className="value-card">
          <Shield size={28} />
          <h3>Tarnish Resistant</h3>
          <p>Engineered with thick 18k gold vermeil and premium protective coatings built for sweat, water, and daily wear.</p>
        </div>
        <div className="value-card">
          <Award size={28} />
          <h3>Artisanal Care</h3>
          <p>Every bezel, prong, and clasp is individually polished and inspected by seasoned master jewelers.</p>
        </div>
      </section>
    </main>
  );
}
