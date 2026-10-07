// Shared helpers for the iPoster embeds: tiny SVG builder, tabs, tooltip, and harmonic math.
(function (global) {
  const NS = "http://www.w3.org/2000/svg";

  function svg(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function text(parent, x, y, str, attrs) {
    const t = svg("text", Object.assign({ x, y }, attrs || {}), parent);
    t.textContent = str;
    return t;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function initTabs(root) {
    const tabs = [...(root || document).querySelectorAll(".tab")];
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute("aria-selected", on);
          document.getElementById(t.dataset.panel).hidden = !on;
        });
        window.dispatchEvent(new CustomEvent("tabchange", { detail: tab.dataset.panel }));
      });
    });
  }

  let tipEl;
  function tip(html, evt) {
    if (!tipEl) {
      tipEl = document.createElement("div");
      tipEl.className = "tooltip";
      document.body.appendChild(tipEl);
    }
    if (!html) { tipEl.classList.remove("on"); return; }
    tipEl.innerHTML = html;
    tipEl.classList.add("on");
    const pad = 14, w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x = evt.clientX + pad, y = evt.clientY + pad;
    if (x + w > innerWidth - 4) x = evt.clientX - w - pad;
    if (y + h > innerHeight - 4) y = evt.clientY - h - pad;
    tipEl.style.left = x + "px";
    tipEl.style.top = y + "px";
  }

  // Quarter-wave-symmetric multilevel staircase: cell k conducts between alpha_k and 180 - alpha_k.
  // Returns the nth harmonic amplitude in units of one cell's DC voltage.
  function staircaseHarmonic(anglesDeg, n) {
    if (n % 2 === 0) return 0;
    let s = 0;
    for (const a of anglesDeg) s += Math.cos((n * a * Math.PI) / 180);
    return (4 / (n * Math.PI)) * s;
  }

  function staircaseValue(anglesDeg, thetaDeg) {
    const t = ((thetaDeg % 360) + 360) % 360;
    const half = t < 180 ? t : t - 180;
    const sign = t < 180 ? 1 : -1;
    let lvl = 0;
    for (const a of anglesDeg) if (half >= a && half <= 180 - a) lvl++;
    return sign * lvl;
  }

  // THD (%) from an amplitude array indexed by harmonic order (index 1 = fundamental).
  function thd(amps, maxOrder) {
    let s = 0;
    for (let n = 2; n <= (maxOrder || amps.length - 1); n++) s += (amps[n] || 0) ** 2;
    return (Math.sqrt(s) / Math.abs(amps[1])) * 100;
  }

  // Direct Fourier sine/cosine projection of a sampled period → amplitude per harmonic order.
  function spectrum(samples, maxOrder) {
    const N = samples.length, out = [0];
    for (let n = 1; n <= maxOrder; n++) {
      let a = 0, b = 0;
      for (let i = 0; i < N; i++) {
        const w = (2 * Math.PI * n * i) / N;
        a += samples[i] * Math.cos(w);
        b += samples[i] * Math.sin(w);
      }
      out.push((2 / N) * Math.hypot(a, b));
    }
    return out;
  }

  const SHE_ANGLES = [6.376, 15.612, 23.253, 33.935, 49.887, 63.235];

  global.IP = { svg, text, clear, initTabs, tip, staircaseHarmonic, staircaseValue, thd, spectrum, SHE_ANGLES };
})(window);

// Wrap every figure in a scroll box (only scrolls when the figure is wider than the frame).
document.querySelectorAll("svg.chart").forEach((s) => {
  if (s.parentElement.classList.contains("chart-scroll")) return;
  const w = document.createElement("div");
  w.className = "chart-scroll";
  s.parentNode.insertBefore(w, s);
  w.appendChild(s);
});
