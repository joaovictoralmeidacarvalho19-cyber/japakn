import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function SiteHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            J
          </span>
          Japakn
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="/#como-funciona" className="transition-colors hover:text-foreground">
            Como funciona
          </a>
          <a href="/#recursos" className="transition-colors hover:text-foreground">
            Recursos
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Meus sites</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth" search={{ mode: "login" }}>
                  Entrar
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Criar meu site
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}