// Apply saved theme before paint to avoid FOUC. Also marks <html> as JS-present
// so .ahz-reveal elements start hidden only when reveal will actually run.
try {
  document.documentElement.classList.add("js");
  const saved = localStorage.getItem("ahz-theme");
  if (saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
