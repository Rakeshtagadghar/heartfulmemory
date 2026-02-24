type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlaceholderPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const path = `/${slug.join("/")}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
          Placeholder Route
        </p>
        <h1 className="mt-2 font-display text-4xl text-parchment">{path}</h1>
        {Object.keys(query).length ? (
          <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
            {JSON.stringify(query, null, 2)}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
