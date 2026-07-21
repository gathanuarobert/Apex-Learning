export default function SEO({ title, description, path, image }) {
  const url = `${SITE_URL}${path}`;
  const fullImage = image ? `${SITE_URL}${image}` : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {fullImage && <meta property="og:image" content={fullImage} />}
      <meta property="og:site_name" content="Apex Learning Hub" />

      <meta name="twitter:card" content={fullImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {fullImage && <meta name="twitter:image" content={fullImage} />}
    </Helmet>
  );
}