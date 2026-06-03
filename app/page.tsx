import { getSiteData } from "@/lib/tina";
import TinaPage from "@/components/TinaPage";

export default async function HomePage() {
  const siteProps = await getSiteData();

  return (
    <TinaPage
      data={siteProps.data}
      variables={siteProps.variables}
      query={siteProps.query}
    />
  );
}
