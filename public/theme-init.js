// Apply saved theme before paint to avoid FOUC.
try {
  const saved = localStorage.getItem("ahz-theme");
  if (saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
