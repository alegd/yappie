import { AudioDetail } from "@/features/audio/audio-detail";

export default async function AudioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AudioDetail audioId={id} />;
}
