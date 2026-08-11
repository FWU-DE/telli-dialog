FROM python:3.12.10-slim-bookworm
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --requirement requirements.txt
COPY gateway.py .
RUN mkdir -p /tmp && chmod 1777 /tmp
USER 65532:65532
EXPOSE 8080
CMD ["python", "gateway.py"]
