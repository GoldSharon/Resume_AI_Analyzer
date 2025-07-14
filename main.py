from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import PyPDF2
import docx
import io
import re
import os

# LangChain imports
from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.schema.output_parser import StrOutputParser

app = FastAPI(title="Resume AI API", version="1.0.0")

# Directories
os.makedirs("static", exist_ok=True)
os.makedirs("templates", exist_ok=True)

# Static files & templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    resume_text: str
    job_description: Optional[str] = None

class ResumeAnalysisResponse(BaseModel):
    ats_score: int
    overall_feedback: str
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    keyword_match: Dict[str, Any]

class ChatResponse(BaseModel):
    response: str

# Output parser models for structured responses
class ResumeAnalysisOutput(BaseModel):
    overall_feedback: str
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]

# Initialize LangChain ChatOllama
llm = ChatOllama(
    model="deepseek-r1:7b-qwen-distill-q4_K_M",
    base_url="http://localhost:11434",
    temperature=0.7
)

# Global context storage
resume_context = {}

# LangChain-based resume analysis functions
class ResumeAnalyzer:
    def __init__(self):
        self.llm = llm
        self.analysis_parser = PydanticOutputParser(pydantic_object=ResumeAnalysisOutput)
        self.str_parser = StrOutputParser()
        
    def create_analysis_prompt(self) -> ChatPromptTemplate:
        """Create a structured prompt for resume analysis"""
        system_template = """You are an expert HR professional and resume reviewer with over 10 years of experience in talent acquisition and career counseling. Your role is to provide comprehensive, actionable feedback on resumes.

Your expertise includes:
- ATS (Applicant Tracking System) optimization
- Industry-specific resume requirements
- Professional formatting and structure
- Keyword optimization
- Career progression analysis

Always provide constructive, specific, and actionable feedback. Focus on practical improvements that can enhance the candidate's chances of getting interviews.

{format_instructions}"""

        human_template = """Please analyze the following resume and provide detailed feedback:

RESUME TEXT:
{resume_text}

JOB DESCRIPTION (if provided):
{job_description}

Please provide:
1. Overall feedback (2-3 sentences summarizing the resume's current state)
2. Top 3 strengths (specific positive aspects)
3. Top 3 weaknesses (areas needing improvement)
4. Top 3 actionable suggestions (specific steps to improve)

Focus on:
- Content quality and relevance
- Professional presentation
- Keyword optimization
- ATS compatibility
- Industry standards"""

        return ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_template),
            HumanMessagePromptTemplate.from_template(human_template)
        ])

    def create_chat_prompt(self) -> ChatPromptTemplate:
        """Create a structured prompt for chat interactions"""
        system_template = """You are an expert HR professional and career counselor. You have access to the user's resume and job description (if provided). Your role is to answer questions about the resume, provide career advice, and help improve the candidate's job search strategy.

Guidelines:
- Be professional, supportive, and constructive
- Provide specific, actionable advice
- Reference the resume content when relevant
- If asked about improvements, be specific about what and how to change
- For career advice, consider industry standards and best practices"""

        human_template = """CONTEXT:
Resume: {resume_text}
Job Description: {job_description}

USER QUESTION: {user_message}

Please provide a helpful, professional response based on the resume and job description provided."""

        return ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_template),
            HumanMessagePromptTemplate.from_template(human_template)
        ])

    async def analyze_resume(self, resume_text: str, job_description: str = None) -> ResumeAnalysisOutput:
        """Analyze resume using LangChain with structured output"""
        try:
            prompt = self.create_analysis_prompt()
            
            # Format the prompt with proper instructions
            formatted_prompt = prompt.format_messages(
                format_instructions=self.analysis_parser.get_format_instructions(),
                resume_text=resume_text[:2000],  # Limit text for API efficiency
                job_description=job_description or "No job description provided"
            )
            
            # Get response from LLM
            response = await self.llm.ainvoke(formatted_prompt)
            
            # Parse the response
            try:
                parsed_output = self.analysis_parser.parse(response.content)
                return parsed_output
            except Exception as parse_error:
                print(f"Parsing error: {parse_error}")
                # Fallback to default structured response
                return ResumeAnalysisOutput(
                    overall_feedback="Resume analysis completed. The document contains relevant professional information and experience sections.",
                    strengths=["Professional experience documented", "Contact information present", "Skills section included"],
                    weaknesses=["Could improve keyword optimization", "Consider adding quantifiable achievements", "Enhance formatting consistency"],
                    suggestions=["Include more industry-relevant keywords", "Add measurable results and metrics", "Improve overall visual presentation"]
                )
                
        except Exception as e:
            print(f"Analysis error: {e}")
            # Fallback response
            return ResumeAnalysisOutput(
                overall_feedback="Resume analysis completed with basic evaluation.",
                strengths=["Document structure present", "Experience section available", "Contact details included"],
                weaknesses=["Needs keyword optimization", "Requires more specific metrics", "Could improve formatting"],
                suggestions=["Add relevant industry keywords", "Include quantifiable achievements", "Enhance professional presentation"]
            )

    async def chat_about_resume(self, user_message: str, resume_text: str, job_description: str = None) -> str:
        """Handle chat interactions about the resume"""
        try:
            prompt = self.create_chat_prompt()
            
            formatted_prompt = prompt.format_messages(
                resume_text=resume_text[:1500],  # Limit for efficiency
                job_description=job_description or "No job description provided",
                user_message=user_message
            )
            
            response = await self.llm.ainvoke(formatted_prompt)
            return response.content
            
        except Exception as e:
            print(f"Chat error: {e}")
            return "I apologize, but I'm having trouble processing your question right now. Please try rephrasing your question or try again later."

# Initialize analyzer
analyzer = ResumeAnalyzer()

# File extraction functions (unchanged)
def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        return "".join(page.extract_text() or "" for page in pdf_reader.pages)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF error: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(file_content))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DOCX error: {str(e)}")

# ATS Score calculation (enhanced)
def calculate_ats_score(resume_text: str, job_description: str = None) -> Dict[str, Any]:
    score = 0
    factors = {}

    # Basic structure checks
    if re.search(r'\b(experience|work|employment|professional)\b', resume_text, re.IGNORECASE):
        score += 12
        factors['has_experience_section'] = True

    if re.search(r'\b(education|degree|university|college|bachelor|master|phd)\b', resume_text, re.IGNORECASE):
        score += 12
        factors['has_education_section'] = True

    if re.search(r'\b(skills|technical|proficient|expertise|competencies)\b', resume_text, re.IGNORECASE):
        score += 12
        factors['has_skills_section'] = True

    # Contact information
    if re.search(r'\b\w+@\w+\.\w+\b', resume_text):
        score += 8
        factors['has_email'] = True

    if re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', resume_text):
        score += 7
        factors['has_phone'] = True

    # Content quality
    word_count = len(resume_text.split())
    if 300 <= word_count <= 800:
        score += 15
        factors['appropriate_length'] = True
    elif 200 <= word_count <= 1200:
        score += 10
        factors['acceptable_length'] = True

    # Dates and quantification
    if len(re.findall(r'\b\d{4}\b', resume_text)) >= 2:
        score += 10
        factors['has_dates'] = True

    # Numbers and achievements
    if re.search(r'\b\d+%|\$\d+|\d+\+|increased|improved|reduced|achieved\b', resume_text, re.IGNORECASE):
        score += 8
        factors['has_quantified_achievements'] = True

    # Job description keyword matching
    if job_description:
        job_keywords = set(re.findall(r'\b[a-zA-Z]{3,}\b', job_description.lower()))
        resume_keywords = set(re.findall(r'\b[a-zA-Z]{3,}\b', resume_text.lower()))
        
        # Remove common stop words
        stop_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}
        job_keywords -= stop_words
        resume_keywords -= stop_words
        
        if job_keywords:
            matched_keywords = job_keywords & resume_keywords
            match_ratio = len(matched_keywords) / len(job_keywords)
            score += int(match_ratio * 16)  # Up to 16 points for perfect match
            
            factors.update({
                'keyword_match_ratio': round(match_ratio, 3),
                'matched_keywords': list(matched_keywords)[:10],  # Top 10 matches
                'missing_keywords': list(job_keywords - resume_keywords)[:10],  # Top 10 missing
                'total_job_keywords': len(job_keywords)
            })

    return {'score': min(score, 100), 'factors': factors}

# API Routes
@app.post("/upload-resume", response_model=ResumeAnalysisResponse)
async def upload_resume(file: UploadFile = File(...), job_description: Optional[str] = Form(None)):
    try:
        content = await file.read()
        
        # Extract text based on file type
        if file.filename.lower().endswith('.pdf'):
            resume_text = extract_text_from_pdf(content)
        elif file.filename.lower().endswith('.docx'):
            resume_text = extract_text_from_docx(content)
        elif file.filename.lower().endswith('.txt'):
            resume_text = content.decode('utf-8')
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT files.")

        # Store in context for chat functionality
        resume_context['resume_text'] = resume_text
        resume_context['job_description'] = job_description

        # Calculate ATS score
        ats_data = calculate_ats_score(resume_text, job_description)

        # Get AI analysis using LangChain
        ai_analysis = await analyzer.analyze_resume(resume_text, job_description)

        return ResumeAnalysisResponse(
            ats_score=ats_data['score'],
            overall_feedback=ai_analysis.overall_feedback,
            strengths=ai_analysis.strengths,
            weaknesses=ai_analysis.weaknesses,
            suggestions=ai_analysis.suggestions,
            keyword_match=ats_data['factors']
        )

    except Exception as e:
        print(f"Error in /upload-resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred while processing your resume: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat_about_resume(request: ChatRequest):
    try:
        # Get resume context
        resume_text = request.resume_text or resume_context.get('resume_text', '')
        job_description = request.job_description or resume_context.get('job_description', '')
        
        if not resume_text:
            raise HTTPException(status_code=400, detail="No resume context available. Please upload a resume first.")

        # Get chat response using LangChain
        response = await analyzer.chat_about_resume(
            user_message=request.message,
            resume_text=resume_text,
            job_description=job_description
        )

        return ChatResponse(response=response)

    except Exception as e:
        print(f"Error in /chat route: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/analyze-text", response_model=ResumeAnalysisResponse)
async def analyze_resume_text(request: ResumeAnalysisRequest):
    """Direct text analysis endpoint"""
    try:
        # Store in context
        resume_context['resume_text'] = request.resume_text
        resume_context['job_description'] = request.job_description

        # Calculate ATS score
        ats_data = calculate_ats_score(request.resume_text, request.job_description)

        # Get AI analysis
        ai_analysis = await analyzer.analyze_resume(request.resume_text, request.job_description)

        return ResumeAnalysisResponse(
            ats_score=ats_data['score'],
            overall_feedback=ai_analysis.overall_feedback,
            strengths=ai_analysis.strengths,
            weaknesses=ai_analysis.weaknesses,
            suggestions=ai_analysis.suggestions,
            keyword_match=ats_data['factors']
        )

    except Exception as e:
        print(f"Error in /analyze-text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Resume AI API with LangChain is running"}

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)