Thanks for pointing that out! You're right — the formatting and structure need to be cleaner and more GitHub-friendly.

Here's a **properly formatted `README.md`** with fixed Markdown syntax, clean sectioning, and a readable folder tree:

---

```markdown
# 📄 Resume AI Analyzer

An AI-powered resume analyzer built using **FastAPI**, **LangChain**, and **DeepSeek via Ollama**, designed to extract key resume information, match it with job descriptions, and provide ATS-like feedback to enhance your hiring potential.

---

## 🚀 Features

- 🔍 Extracts text from PDF and DOCX resumes
- 🤖 Uses `deepseek-r1:7b-qwen-distill` model (via Ollama)
- 📊 Generates ATS score and personalized feedback
- ✅ Highlights strengths, weaknesses, and keyword matching
- 🧠 Conversational Q&A with LLM for detailed resume improvement
- 🌐 Clean UI using HTML, CSS, and JavaScript

---

## 🛠️ Tech Stack

- **Backend:** FastAPI, Python
- **AI/LLM:** LangChain, DeepSeek via Ollama
- **Frontend:** HTML5, CSS3, JavaScript, Jinja2
- **Parsing:** PyPDF2, python-docx

---

## 📁 Folder Structure

```

Resume\_AI\_Analyzer/
├── main.py                 # FastAPI backend application
├── requirements.txt        # Python dependencies
├── README.md               # Project documentation
├── static/                 # Frontend static files
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
├── templates/
│   └── index.html          # Jinja2 HTML template
├── uploaded\_documents/     # Directory for uploaded resumes
└── .gitignore              # Ignored files and folders

````

---

## 🧪 Installation & Usage

### 1. Clone the Repository

```bash
git clone https://github.com/GoldSharon/Resume_AI_Analyzer.git
cd Resume_AI_Analyzer
````

### 2. Install Dependencies

Make sure you have **Python 3.9+** installed:

```bash
pip install -r requirements.txt
```

### 3. Start Ollama with DeepSeek Model

Ensure Ollama is running locally and the model is available:

```bash
ollama run deepseek-r1:7b-qwen-distill
```

### 4. Run the FastAPI Server

```bash
uvicorn main:app --reload
```

Open your browser and navigate to: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 📌 Example Use Case

1. Upload your resume.
2. (Optional) Provide a job description.
3. The AI analyzes and returns:

   * ATS Score
   * Strengths and Weaknesses
   * Overall Feedback
   * Keyword Matching
4. You can interact with the AI to ask questions about how to improve your resume.

---

## 📄 Requirements

See `requirements.txt` for all dependencies. Core packages include:

* `fastapi`
* `uvicorn`
* `PyPDF2`
* `python-docx`
* `langchain`
* `langchain_ollama`
* `pydantic`

---

## ⚖️ License

This project is open-source under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Gold Sharon R**
B.Tech in Artificial Intelligence and Machine Learning
St. Joseph’s College of Engineering, Chennai
📧 [gold33sharon@gmail.com](mailto:gold33sharon@gmail.com)
🌐 [GitHub](https://github.com/GoldSharon)

---

## 🌟 Contribute

Feel free to fork this repository and open a pull request. Bug reports and feature suggestions are always welcome!

---

## 🧠 Future Improvements

* Add user authentication and login system
* Integrate resume saving and job tracking
* Enhance prompt tuning for better insights
* Deploy on cloud (Render, Railway, Heroku, etc.)

````

---

### ✅ Instructions to Use:

1. Copy the above into a file named `README.md`.
2. Place it in the root of your project directory.
3. Commit it to GitHub:

```bash
git add README.md
git commit -m "Add formatted project README"
git push
````

Let me know if you'd like a matching `requirements.txt` or `.gitignore` file!
