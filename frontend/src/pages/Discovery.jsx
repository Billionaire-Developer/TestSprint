import React, { useState } from "react";
import { DISCOVERY_CATEGORIES } from "../discoveryContent";

export default function Discovery() {
  const [activeKey, setActiveKey] = useState(DISCOVERY_CATEGORIES[0].key);
  const activeCategory = DISCOVERY_CATEGORIES.find((c) => c.key === activeKey);

  return (
    <div className="discovery">
      <h1>Discovery</h1>
      <p className="discovery-subtitle">
        Explore beyond the test — pick a topic below. This isn't graded, just for curiosity.
      </p>

      <div className="discovery-tabs">
        {DISCOVERY_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={cat.key === activeKey ? "tab tab-active" : "tab"}
            onClick={() => setActiveKey(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <p className="discovery-intro">{activeCategory.intro}</p>

      <div className="discovery-items">
        {activeCategory.items.map((item, idx) => (
          <div key={idx} className="discovery-card">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}