#!/usr/bin/env bash
set -e

echo "=================================================================="
echo " Starting TalentPulse AI Resume Screening & Candidate Intelligence"
echo "=================================================================="

# 1. Start PostgreSQL if installed
if command -v service >/dev/null 2>&1; then
  sudo service postgresql start || true
fi

# 2. Ensure Python dependencies & spaCy model are installed
pip install -q -r /home/user/requirements.txt
python3 -c "import spacy; spacy.load('en_core_web_md')" 2>/dev/null || python3 -m spacy download en_core_web_md

# 3. Ensure Frontend dependencies are installed
if [ ! -d "/home/user/frontend/node_modules" ]; then
  cd /home/user/frontend && npm install
fi

echo "Setup verified. Run:"
echo "  Backend:  uvicorn backend.main:app --host 0.0.0.0 --port 8000"
echo "  Frontend: cd frontend && npm run dev"
