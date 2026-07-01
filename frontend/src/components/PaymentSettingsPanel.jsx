// src/components/PaymentSettingsPanel.jsx
import React, { useEffect, useState } from "react";
import { FaSave, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import api from "../Api";

const GATEWAYS = [
  { id: "pesapal", label: "Pesapal" },
  { id: "mpesa",   label: "M-Pesa" },
];

export default function PaymentSettingsPanel() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const [form, setForm] = useState({
    active_gateway: "pesapal",
    pesapal_environment: "live",
    pesapal_consumer_key: "",
    pesapal_consumer_secret: "",
    pesapal_ipn_id: "",
    mpesa_environment: "sandbox",
    mpesa_consumer_key: "",
    mpesa_consumer_secret: "",
    mpesa_shortcode: "",
    mpesa_passkey: "",
  });

  const fetchSettings = async () => {
    try {
      const res = await api.get("payments/settings/");
      // Secrets are write-only on the backend, so they come back blank —
      // that's expected, not a bug. We never display existing secrets.
      setForm((prev) => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error("Failed to load payment settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg("");
    try {
      // Only send secret fields if the admin actually typed something new —
      // empty string would otherwise wipe out the saved credential.
      const payload = { ...form };
      ["pesapal_consumer_secret", "mpesa_consumer_secret", "mpesa_passkey"].forEach((f) => {
        if (!payload[f]) delete payload[f];
      });

      await api.patch("payments/settings/", payload);
      setSavedMsg("Payment settings updated successfully.");
      setTimeout(() => setSavedMsg(""), 4000);
      fetchSettings(); // re-pull to confirm + clear secret inputs
    } catch (err) {
      console.error(err);
      alert("Failed to save payment settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500 text-center py-8">Loading payment settings...</p>;
  }

  return (
    <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-semibold">Payment Gateway Settings</h3>
        <button
          type="button"
          onClick={() => setShowSecrets((s) => !s)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          {showSecrets ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
          {showSecrets ? "Hide secrets" : "Show secrets"}
        </button>
      </div>

      {/* Active gateway toggle */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-300 mb-2">Active Gateway</label>
        <div className="flex gap-3">
          {GATEWAYS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => handleChange("active_gateway", g.id)}
              className={`flex-1 px-4 py-3 rounded-lg border text-sm font-semibold transition-colors
                ${form.active_gateway === g.id
                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                  : "bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Only the active gateway is used for checkout. Switching is instant — no deploy needed.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* ── Pesapal ───────────────────────────────────────────── */}
        <div className={`p-4 rounded-xl border ${form.active_gateway === "pesapal" ? "border-cyan-500/40 bg-cyan-500/5" : "border-gray-700"}`}>
          <h4 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
            Pesapal
            {form.active_gateway === "pesapal" && <FaCheckCircle className="text-cyan-400" size={12} />}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Environment">
              <select
                value={form.pesapal_environment}
                onChange={(e) => handleChange("pesapal_environment", e.target.value)}
                className={inputClass}
              >
                <option value="live">Live</option>
                <option value="sandbox">Sandbox</option>
              </select>
            </Field>

            <Field label="IPN ID">
              <input
                type="text"
                value={form.pesapal_ipn_id}
                onChange={(e) => handleChange("pesapal_ipn_id", e.target.value)}
                className={inputClass}
                placeholder="Registered IPN ID"
              />
            </Field>

            <Field label="Consumer Key">
              <input
                type="text"
                value={form.pesapal_consumer_key}
                onChange={(e) => handleChange("pesapal_consumer_key", e.target.value)}
                className={inputClass}
                placeholder="Pesapal consumer key"
              />
            </Field>

            <Field label="Consumer Secret">
              <input
                type={showSecrets ? "text" : "password"}
                value={form.pesapal_consumer_secret}
                onChange={(e) => handleChange("pesapal_consumer_secret", e.target.value)}
                className={inputClass}
                placeholder="Leave blank to keep current secret"
              />
            </Field>
          </div>
        </div>

        {/* ── M-Pesa ────────────────────────────────────────────── */}
        <div className={`p-4 rounded-xl border ${form.active_gateway === "mpesa" ? "border-cyan-500/40 bg-cyan-500/5" : "border-gray-700"}`}>
          <h4 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
            M-Pesa (Daraja)
            {form.active_gateway === "mpesa" && <FaCheckCircle className="text-cyan-400" size={12} />}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Environment">
              <select
                value={form.mpesa_environment}
                onChange={(e) => handleChange("mpesa_environment", e.target.value)}
                className={inputClass}
              >
                <option value="sandbox">Sandbox</option>
                <option value="live">Live</option>
              </select>
            </Field>

            <Field label="Shortcode">
              <input
                type="text"
                value={form.mpesa_shortcode}
                onChange={(e) => handleChange("mpesa_shortcode", e.target.value)}
                className={inputClass}
                placeholder="Paybill / Till number"
              />
            </Field>

            <Field label="Consumer Key">
              <input
                type="text"
                value={form.mpesa_consumer_key}
                onChange={(e) => handleChange("mpesa_consumer_key", e.target.value)}
                className={inputClass}
                placeholder="Daraja consumer key"
              />
            </Field>

            <Field label="Consumer Secret">
              <input
                type={showSecrets ? "text" : "password"}
                value={form.mpesa_consumer_secret}
                onChange={(e) => handleChange("mpesa_consumer_secret", e.target.value)}
                className={inputClass}
                placeholder="Leave blank to keep current secret"
              />
            </Field>

            <Field label="Passkey">
              <input
                type={showSecrets ? "text" : "password"}
                value={form.mpesa_passkey}
                onChange={(e) => handleChange("mpesa_passkey", e.target.value)}
                className={inputClass}
                placeholder="Leave blank to keep current passkey"
              />
            </Field>
          </div>

          <p className="text-xs text-amber-400/80 mt-3">
            ⚠️ M-Pesa credentials pending from client. Gateway is scaffolded but not yet live-tested.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaSave size={13} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {savedMsg && <span className="text-emerald-400 text-sm">{savedMsg}</span>}
        </div>
      </form>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-300 mb-2">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-gray-700 border border-gray-600 rounded-lg px-3 md:px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors";