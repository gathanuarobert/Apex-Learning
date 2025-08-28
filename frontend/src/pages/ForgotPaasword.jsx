// src/pages/ForgotPassword.jsx

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particleOptions = {
    background: {
      color: {
        value: "#0B1220", // A very dark blue/black
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "repulse",
        },
        onClick: {
          enable: true,
          mode: "push",
        },
      },
      modes: {
        repulse: {
          distance: 100,
          duration: 0.4,
        },
        push: {
          quantity: 4,
        },
      },
    },
    particles: {
      number: {
        value: 50,
        density: {
          enable: true,
          area: 800,
        },
      },
      color: {
        value: ["#FDE047", "#22D3EE", "#A78BFA"], // Yellow, Cyan, and Purple for a professional blend
      },
      shape: {
        type: "circle",
      },
      opacity: {
        value: 0.5,
      },
      size: {
        value: { min: 1, max: 3 },
      },
      links: {
        enable: true,
        distance: 150,
        color: "#ffffff",
        opacity: 0.2,
        width: 1,
      },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        random: false,
        straight: false,
        outModes: {
          default: "out",
        },
        attract: {
          enable: false,
          rotateX: 600,
          rotateY: 1200,
        },
      },
    },
    detectRetina: true,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send password reset email.");
      }

      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={particleOptions}
        className="absolute inset-0 -z-10"
      />

      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 relative z-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold leading-9 tracking-tight text-yellow-300">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md bg-white/5 backdrop-blur-md p-8 rounded-xl shadow-lg ring-1 ring-white/10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-100">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:bg-gray-500"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>

            {message && <p className="text-center text-sm text-green-400 mt-4">{message}</p>}
            {error && <p className="text-center text-sm text-red-400 mt-4">{error}</p>}
          </form>

          <p className="mt-10 text-center text-sm text-gray-400">
            Remembered your password?{" "}
            <Link to="/login" className="font-semibold leading-6 text-cyan-400 hover:text-cyan-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}