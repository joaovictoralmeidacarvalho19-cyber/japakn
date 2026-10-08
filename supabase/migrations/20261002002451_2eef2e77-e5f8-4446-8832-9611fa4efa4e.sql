CREATE OR REPLACE FUNCTION public.get_published_site(_slug text)
RETURNS TABLE(name text, slug text, site_config jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.name, p.slug, p.site_config FROM public.projects p
  WHERE p.slug = _slug AND p.status = 'published' LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_published_site(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_site(text) TO anon, authenticated;
DROP POLICY IF EXISTS projects_public_published ON public.projects;
CREATE INDEX IF NOT EXISTS versions_user_created_idx ON public.versions (user_id, created_at);