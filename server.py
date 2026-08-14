import os
from flask import Flask

# تأكد من أن اسم التطبيق هنا هو نفس الاسم اللي بتنادي عليه في الـ Procfile
# يعني لو في Procfile مكتوب gunicorn server:app، لازم الـ Flask يكون اسمه app
app = Flask(__name__)

@app.route('/')
def home():
    return "الموقع يعمل بنجاح!"

# هذا الجزء مهم جداً للـ Deployment
if __name__ == "__main__":
    # Railway بيحدد البورت ديناميكياً، فإحنا بنقرأه من المتغير PORT
    port = int(os.environ.get("PORT", 5000))
    # الـ host لازم يكون 0.0.0.0 عشان Railway يقدر يوصل للسيرفر
    app.run(host="0.0.0.0", port=port)
