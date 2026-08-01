import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const LocationContext = createContext("/");
const NavigateContext = createContext<(to: string) => void>(() => {});

export function HashRouter({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useState(() => {
    if (typeof window === "undefined") return "/";
    return window.location.hash.replace(/^#/, "") || "/";
  });

  useEffect(() => {
    const update = () => {
      setLoc(window.location.hash.replace(/^#/, "") || "/");
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const navigate = (to: string) => {
    const hash = to.startsWith("/") ? `#${to}` : `#/${to}`;
    window.location.hash = hash;
  };

  return (
    <LocationContext.Provider value={loc}>
      <NavigateContext.Provider value={navigate}>{children}</NavigateContext.Provider>
    </LocationContext.Provider>
  );
}

export function useLocation(): string {
  return useContext(LocationContext);
}

export function useNavigate(): (to: string) => void {
  return useContext(NavigateContext);
}
