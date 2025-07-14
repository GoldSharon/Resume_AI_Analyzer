Great! That README content looks **much more structured and professional** — but there's still one **major issue**:

### ❗️Problem: The folder structure in your README is not formatted correctly.

Right now, it appears as a jumbled single line:

```
Resume_AI_Analyzer/ ├── main.py # FastAPI backend application ├── requirements.txt ...
```

---

### ✅ Fix: Format Folder Tree as a Code Block

You should wrap the folder structure in a code block so GitHub renders it properly.

---

### ✅ Final Polished `README.md`

````markdown
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

```text
Resume_AI_Analyzer/
├── main.py                  # FastAPI backend application
├── requirements.txt         # Python dependencies
├── README.md                # Project documentation
├── static/                  # Frontend static files
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
├── templates/
│   └── index.html           # Jinja2 HTML template
├── uploaded_documents/      # Directory for uploaded resumes
└── .gitignore               # Git ignored files
````

---

## 🧪 Installation & Usage

### 1. Clone the Repository

```bash
git clone https://github.com/GoldSharon/Resume_AI_Analyzer.git
cd Resume_AI_Analyzer
```

### 2. Install Dependencies

Make sure you have **Python 3.9+** installed.

```bash
pip install -r requirements.txt
```

### 3. Start Ollama with DeepSeek Model

Ensure Ollama is installed and the model is pulled:

```bash
ollama run deepseek-r1:7b-qwen-distill
```

### 4. Run the FastAPI Server

```bash
uvicorn main:app --reload
```

Then open your browser and navigate to:
👉 `http://127.0.0.1:8000`

---

## 📌 Example Use Case

1. Upload your resume
2. Optionally add a job description
3. The AI analyzes and returns:

   * ATS Score
   * Strengths & Weaknesses
   * Feedback
   * Keyword Matching

You can interact with the AI chatbot to improve your resume further.

---

## 📄 Requirements

See `requirements.txt`. Key libraries include:

* `fastapi`
* `uvicorn`
* `PyPDF2`
* `python-docx`
* `langchain`
* `langchain_ollama`
* `pydantic`

---

## ⚖️ License

MIT License © 2025 Gold Sharon R

---

## 👨‍💻 Author

**Gold Sharon R**
B.Tech in Artificial Intelligence and Machine Learning
St. Joseph’s College of Engineering, Chennai
📧 [gold33sharon@gmail.com](mailto:gold33sharon@gmail.com)
🌐 [GitHub Profile](https://github.com/GoldSharon)

---

## 🌟 Contribute

Feel free to fork this repository and open a pull request.
Bug reports and feature suggestions are welcome!

---

## 🧠 Future Improvements

* Add user authentication & login system
* Save resume analysis history
* Enhance LLM prompt tuning
* Deploy to cloud (Render, Railway, Heroku)

---

````

---

### ✅ Next Steps:

1. Replace your current `README.md` with this.
2. Push to GitHub:

```bash
git add README.md
git commit -m "Fix README formatting and folder structure"
git push
````

Want help generating:

* `requirements.txt`?
* `.gitignore`?
* Badges (like Python version, License, etc.)?

Let me know — happy to help polish the repo more!
