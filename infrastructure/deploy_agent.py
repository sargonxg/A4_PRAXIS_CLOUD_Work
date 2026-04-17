"""Deploy the Deep Research ADK agent to Vertex AI Agent Engine with Memory Bank."""
import argparse
import subprocess
import sys

sys.path.insert(0, "backend")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--location", default="us-central1")
    parser.add_argument("--staging-bucket", required=True)
    parser.add_argument("--output-secret", required=True)
    args = parser.parse_args()

    import vertexai
    from vertexai.preview.reasoning_engines import AdkApp

    from agents.deep_research.agent import deep_research_agent

    client = vertexai.Client(project=args.project_id, location=args.location)

    adk_app = AdkApp(agent=deep_research_agent)

    memory_bank_config = {
        "memory_bank_config": {
            "generation_config": {
                "model": f"projects/{args.project_id}/locations/{args.location}/publishers/google/models/gemini-3-flash-preview"
            }
        }
    }

    engine = client.agent_engines.create(
        agent_engine=adk_app,
        config={
            "staging_bucket": args.staging_bucket,
            "requirements": ["google-cloud-aiplatform[agent_engines,adk]>=1.80.0"],
            "context_spec": memory_bank_config,
        },
    )

    engine_id = engine.api_resource.name.split("/")[-1]
    print(f"Deployed agent engine: {engine_id}")

    # Write to Secret Manager
    subprocess.run([
        "gcloud", "secrets", "create", args.output_secret,
        "--data-file=-",
    ], input=engine_id.encode(), check=False)
    subprocess.run([
        "gcloud", "secrets", "versions", "add", args.output_secret,
        "--data-file=-",
    ], input=engine_id.encode(), check=True)
    print(f"Stored engine ID in Secret Manager: {args.output_secret}")


if __name__ == "__main__":
    main()
