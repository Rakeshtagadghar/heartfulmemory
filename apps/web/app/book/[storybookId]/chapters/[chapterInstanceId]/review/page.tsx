import { redirect } from "next/navigation";
import { AppShell } from "../../../../../../components/app/app-shell";
import { requireAuthenticatedUser } from "../../../../../../lib/auth/server";
import { getOrCreateProfileForUser } from "../../../../../../lib/profile";
import { ReviewClientView } from "./client-view";

type Props = {
    params: Promise<{ storybookId: string; chapterInstanceId: string }>;
};

export default async function ChapterReviewPage({ params }: Props) {
    const { storybookId, chapterInstanceId } = await params;
    const user = await requireAuthenticatedUser(`/book/${storybookId}/chapters/${chapterInstanceId}/review`);
    const profile = await getOrCreateProfileForUser(user);

    if (!profile.onboarding_completed) redirect("/app/onboarding");

    // We fetch standard auth to pass to the client component
    // Using a client component lets us leverage `useQuery` and `useAction` naturally.
    return (
        <AppShell email={user.email} profile={profile}>
            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
                <ReviewClientView
                    storybookId={storybookId}
                    chapterInstanceId={chapterInstanceId}
                />
            </div>
        </AppShell>
    );
}
