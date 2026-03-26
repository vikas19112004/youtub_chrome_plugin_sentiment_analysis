from flask import Flask, request, jsonify
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from flask_cors import CORS
import requests
import mlflow
from dotenv import load_dotenv
import os

load_dotenv()
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

app = Flask(__name__)
CORS(app)  # allow frontend (extension) to call API

analyzer = SentimentIntensityAnalyzer()

@app.route("/")
def home():
    return "YouTube Sentiment API Running 🚀"

@app.route("/get-comments", methods=["POST"])
def get_comments():
    video_id = request.json.get("videoId")

    comments = []
    next_page_token = ""

    for _ in range(2):  # ~100 comments
        url = f"https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={video_id}&maxResults=50&pageToken={next_page_token}&key={YOUTUBE_API_KEY}"

        res = requests.get(url).json()

        for item in res.get("items", []):
            comment = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
            comments.append(comment)

        next_page_token = res.get("nextPageToken")
        if not next_page_token:
            break

    return jsonify({"comments": comments})

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    comments = data.get("comments", [])

    results = []

    # MLflow logging (for marks)
    mlflow.start_run()
    mlflow.log_param("model", "VADER Sentiment")

    for comment in comments:
        score = analyzer.polarity_scores(comment)

        if score["compound"] >= 0.05:
            sentiment = "Positive"
        elif score["compound"] <= -0.05:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"

        results.append({
            "comment": comment,
            "sentiment": sentiment
        })

    mlflow.end_run()

    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)