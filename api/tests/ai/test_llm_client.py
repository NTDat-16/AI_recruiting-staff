import pytest
from app.ai.llm_client import get_llm_client, MockLLMClient
from app.ai.embeddings import embedding_client
from app.ai.stt import get_stt_client


@pytest.mark.asyncio
async def test_mock_llm_client_match_cv():
    client = get_llm_client()
    analysis = await client.match_cv(
        job_title="Senior Python Backend Engineer",
        department="Engineering",
        job_description="Phát triển hệ thống microservices và AI backend",
        job_requirements="3 năm kinh nghiệm Python, FastAPI, Docker",
        criteria_weights={"required_skills": 0.4, "experience_years": 0.3},
        candidate_name="Nguyen Van A",
        cv_content="3.5 năm kinh nghiệm lập trình Python, thành thạo FastAPI, PostgreSQL, Docker.",
    )
    assert analysis.overall_score >= 0.0
    assert len(analysis.breakdown) > 0
    assert bool(analysis.recommendation)


@pytest.mark.asyncio
async def test_mock_llm_question_generation():
    client = get_llm_client()
    result = await client.generate_interview_questions(
        job_title="AI Engineer",
        job_requirements="Python, LLM, RAG, PyTorch",
        candidate_name="Le Van B",
        cv_summary="2 năm kinh nghiệm NLP và xây dựng LangChain pipelines",
    )
    assert len(result.questions) > 0
    assert result.questions[0].category is not None


@pytest.mark.asyncio
async def test_embedding_client():
    vec_a = await embedding_client.get_embedding("Python developer with FastAPI experience")
    vec_b = await embedding_client.get_embedding("Software engineer working with Python and FastAPI")
    similarity = embedding_client.compute_similarity(vec_a, vec_b)
    assert 0.0 <= similarity <= 1.0


@pytest.mark.asyncio
async def test_stt_client():
    stt = get_stt_client()
    segments = await stt.transcribe_audio("mock_path.mp3")
    assert len(segments) >= 2
    assert segments[0].speaker is not None
    assert segments[0].text != ""
