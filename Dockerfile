# Základný image s Python 3.12
FROM python:3.12-slim

# Nastavenie pracovného adresára v kontajneri
WORKDIR /app

# Skopíruj requirements.txt a nainštaluj závislosti
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Skopíruj celý projekt do kontajnera
COPY . .

# Nastavenie prostredia
ENV PYTHONUNBUFFERED=1

# Exponovanie portu
EXPOSE 8000

# Príkaz na spustenie Django servera
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
