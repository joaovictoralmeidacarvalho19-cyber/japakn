import { createFileRoute } from "@tanstack/react-router";
import { getPublishedSite } from "@/lib/public-site.functions";
import { SiteRenderer } from "@/components/site-renderer/SiteRenderer";

export const Route = createFileRoute("/s/$slug")({
  loader: ({ params }) => getPublishedSite({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    if (!loaderData?.found) {
      return { meta: [{ title: "Site não encontrado" }, { name: "robots", content: "noindex" }] };
    }
    const title = loaderData.config.seo.title || loaderData.name;
    const description =
      loaderData.config.seo.description || loaderData.config.business.description || `Site de ${loaderData.name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <Unavailable />,
  notFoundComponent: () => <Unavailable />,
  component: PublicSite,
});

function Unavailable() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">Site não disponível</h1>
        <p className="mt-2 text-muted-foreground">Este endereço não existe ou o site ainda não foi publicado.</p>
      </div>
    </main>
  );
}

function PublicSite() {
  const data = Route.useLoaderData();
  if (!data.found) return <Unavailable />;
  return <SiteRenderer config={data.config} />;
}
