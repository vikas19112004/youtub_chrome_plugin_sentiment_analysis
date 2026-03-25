from flask import Flask, request, jsonify
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from flask_cors import CORS
import mlflow

app = Flask(__name__)
CORS(app)  # allow frontend (extension) to call API

analyzer = SentimentIntensityAnalyzer()

@app.route("/")
def home():
    return "YouTube Sentiment API Running 🚀"

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