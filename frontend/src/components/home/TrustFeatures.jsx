import React from "react";
import { ThumbsUp, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import "./TrustFeatures.css";

const features = [
  {
    id: "quality",
    icon: <ThumbsUp size={22} strokeWidth={2} />,
    title: "High Quality",
    description:
      "Crafted with 18k solid gold vermeil and ethically sourced gemstones for lasting beauty and elegance.",
  },
  {
    id: "delivery",
    icon: <Truck size={24} strokeWidth={2} />,
    title: "Fast Delivery",
    description:
      "Quick and insured express shipping across India, ensuring your jewellery reaches you safely on time.",
  },
  {
    id: "warranty",
    icon: <ShieldCheck size={25} strokeWidth={2} />,
    title: "Best Warranty",
    description:
      "Shop with confidence knowing your purchase is backed by our lifetime authenticity guarantee and support.",
  },
  {
    id: "exchange",
    icon: <RotateCcw size={22} strokeWidth={2} />,
    title: "Easy 15-Day Returns",
    description:
      "Enjoy 15-day complimentary exchanges and hassle-free doorstep returns with signature luxury packaging.",
  },
];

export function TrustFeatures() {
  return (
    <section className="trust-features-section" aria-label="Why Shop With Flash Jewels">
      <div className="trust-features-grid">
        {features.map((item) => (
          <div key={item.id} className="trust-card">
            <div className="trust-icon-wrapper" aria-hidden="true">
              {item.icon}
            </div>
            <div className="trust-text">
              <h3 className="trust-title">{item.title}</h3>
              <p className="trust-desc">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
