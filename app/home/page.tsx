import { redirect } from "next/navigation";

// /home redirige désormais vers / (racine)
export default function HomeRedirectPage() {
  redirect("/");
}
