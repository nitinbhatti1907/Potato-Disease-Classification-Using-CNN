import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import logo from "./logo.png";
import bg from "./bg.png";

/**
 * UI revamped with Tailwind (via CDN) + fully responsive layout.
 * Note: Tailwind CDN is added in /public/index.html.
 */
export const ImageUpload = () => {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = useMemo(() => {
    // Allow both:
    // 1) Full endpoint: http://127.0.0.1:8000/predict
    // 2) Base URL: http://127.0.0.1:8000
    const raw = (process.env.REACT_APP_API_URL || "").trim();
    if (!raw) return "http://127.0.0.1:8000/predict";
    return raw.endsWith("/predict") ? raw : `${raw.replace(/\/$/, "")}/predict`;
  }, []);

  const resetAll = () => {
    setSelectedFile(null);
    setPreview("");
    setData(null);
    setError("");
    setIsLoading(false);
    setDragActive(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setFile = (file) => {
    if (!file) return;
    setError("");
    setData(null);
    setSelectedFile(file);
  };

  // preview URL
  useEffect(() => {
    if (!selectedFile) {
      setPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const sendFile = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      setError("");

      const formData = new FormData();
      // backend expects "file"
      formData.append("file", selectedFile);

      const res = await axios.post(apiUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      });

      setData(res.data);
    } catch (e) {
      // Axios error handling
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Something went wrong while predicting.";
      setError(String(msg));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-predict when preview created
  useEffect(() => {
    if (!preview) return;
    sendFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) setFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const confidencePct = useMemo(() => {
    if (!data?.confidence) return null;
    const c = Number.parseFloat(data.confidence);
    if (Number.isNaN(c)) return null;
    return (c * 100).toFixed(2);
  }, [data]);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px)",
          transform: "scale(1.05)",
          opacity: 0.6,
        }}
      />

      {/* Top Nav */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
              <img
                src={logo}
                alt="logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-wide text-white/90">
                NB: Potato Disease Classification
              </p>
              <p className="text-xs text-white/60">
                Upload a potato leaf image to detect disease
              </p>
            </div>
          </div>

          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 md:inline-flex"
          >
            API Docs
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Left: Uploader */}
          <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-xl backdrop-blur">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Potato Leaf Disease Detector
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Drag & drop an image (JPG/PNG) or browse to upload. Prediction will
              run automatically.
            </p>

            {/* Drop zone */}
            <div
              className={`mt-5 flex min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 transition ${dragActive
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-white/15 bg-white/5 hover:bg-white/10"
                }`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            >
              {!preview ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white/80"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3"
                      />
                    </svg>
                  </div>

                  <p className="mt-4 text-center text-sm text-white/70">
                    Drag and drop an image of a potato plant leaf to process
                  </p>

                  <button
                    type="button"
                    onClick={onBrowseClick}
                    className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:scale-[0.99]"
                  >
                    Browse file
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileInputChange}
                  />

                  <p className="mt-3 text-xs text-white/50">
                    Tip: Use clear leaf close-up for best results.
                  </p>
                </>
              ) : (
                <div className="w-full">
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <img
                      src={preview}
                      alt="preview"
                      className="h-[320px] w-full object-contain md:h-[360px]"
                    />

                    {/* loader overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-6 py-4 backdrop-blur">
                          <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          <p className="text-sm text-white/80">Processing...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={onBrowseClick}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
                    >
                      Change image
                    </button>

                    <button
                      type="button"
                      onClick={resetAll}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white/90"
                    >
                      Clear
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileInputChange}
                    />
                  </div>

                  {error && (
                    <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                      <p className="text-sm font-semibold text-rose-200">
                        Prediction failed
                      </p>
                      <p className="mt-1 break-words text-xs text-rose-100/80">
                        {error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Right: Results */}
          <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Prediction</h2>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                CNN Model
              </span>
            </div>

            {!data && !isLoading && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/70">
                  Upload an image to see the predicted label and confidence
                  score.
                </p>
              </div>
            )}

            {data && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-xs text-white/60">Label</p>
                    <p className="mt-2 text-xl font-bold tracking-tight">
                      {data.class}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-xs text-white/60">Confidence</p>
                    <p className="mt-2 text-xl font-bold tracking-tight">
                      {confidencePct ? `${confidencePct}%` : "—"}
                    </p>
                  </div>
                </div>

                {/* subtle note */}
                <p className="mt-4 text-xs text-white/50">
                  Confidence is based on model probability output.
                </p>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white/90">Tips</p>
              <ul className="mt-2 space-y-2 text-xs text-white/70">
                <li>• Use well-lit images with the leaf in focus.</li>
                <li>• Avoid backgrounds that cover the leaf surface.</li>
                <li>• Try multiple angles if the result looks wrong.</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Open API Docs
              </a>

              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                New Prediction
              </button>
            </div>
          </section>
        </div>

        <footer className="mt-10 pb-6 text-center text-xs text-white/50">
          Built with FastAPI + React • Deployed on Hugging Face Spaces by{" "}
          <a
            href="https://www.linkedin.com/in/bhattinitin/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-white/80 underline underline-offset-4 hover:text-white"
          >
            Nitin Bhatti
          </a>
        </footer>
      </main>
    </div>
  );
};
