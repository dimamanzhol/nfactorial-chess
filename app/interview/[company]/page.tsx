import InterviewRoom from "./InterviewRoom";

const VALID_COMPANIES = ["google", "meta", "amazon", "apple"];

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const normalizedCompany = VALID_COMPANIES.includes(company) ? company : "google";

  return <InterviewRoom company={normalizedCompany} />;
}
