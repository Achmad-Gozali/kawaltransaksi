export type FeedbackItem = { id: string; message: string; createdAt: string };
export default function FeedbackTab({ feedbacks, token }: { feedbacks: FeedbackItem[]; token: string }) {
  return <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center"><p className="text-sm text-slate-400">Feedback segera hadir.</p></div>;
}