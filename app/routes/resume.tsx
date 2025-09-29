import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router";
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import Details from "~/components/Details";
import ATS from "~/components/ATS";

export const meta = () => [
  { title: "ResumAI | Review" },
  { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();

  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) navigate("/auth?next=/resume/${id}");
  }, [isLoading]);

  useEffect(() => {
    const loadResume = async () => {
      try {
        if (!id) return;

        const resume = await kv.get(`resume:${id}`);
        if (!resume) return "resume is not present";

        const data = JSON.parse(resume);

        const resumeBlob = await fs.read(data.resumePath);
        if (!resumeBlob) return "resumeBlob is not present";

        setResumeUrl(
          URL.createObjectURL(
            new Blob([resumeBlob], { type: "application/pdf" })
          )
        );

        const imageBlob = await fs.read(data.imagePath);
        if (!imageBlob) return "imageBlob is not present";

        setImageUrl(URL.createObjectURL(imageBlob));
        setFeedback(data.feedback);

        console.log({ resumeUrl, imageUrl, feedback: data.feedback });
      } catch (err) {
        console.error("Failed to load resume:", err);
      }
    };

    loadResume();
  }, [id]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 font-semibold text-sm">
            {" "}
            Back to Homepage{" "}
          </span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className='feedback-section bg-[url("/images/bg-small.svg")] bg-cover h-[100vh] sticky top-0 flex items-center justify-center'>
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit ">
              <a>
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                />
              </a>
            </div>
          )}
        </section>

        <section className="feedback-section">
          <h2 className="text-4xl text-black font-bold">Resume Review</h2>

          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000 ">
              <Summary feedback={feedback}/>
              <ATS score = {feedback.ATS.score || 0} suggestion={feedback.ATS.tips || []}/>
              <Details feedback={feedback} />
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" alt="" className="w-full" />
          )}
        </section>
      </div>
    </main>
  );
};

export default Resume;
