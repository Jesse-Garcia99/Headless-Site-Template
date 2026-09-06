import Link from "next/link";

export default function NotFound() {
  return <main><h1>Page not found</h1><p>The page may have moved or the link is incorrect.</p><Link href="/">Return home</Link></main>;
}
