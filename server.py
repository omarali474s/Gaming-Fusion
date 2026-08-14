import os
from flask import Flask, render_template_string, request, send_file
import yt_dlp

app = Flask(__name__)

# قالب HTML بسيط وشيك عشان يظهر للناس واجهة التحميل
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>موقع تحميل الفيديوهات</title>
    <style>
        body { font-family: Tahoma, sans-serif; background: #0f172a; color: #fff; text-align: center; padding-top: 50px; }
        .container { background: #1e293b; padding: 30px; border-radius: 12px; display: inline-block; width: 400px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        input[type="text"] { width: 90%; padding: 10px; margin: 10px 0; border-radius: 6px; border: none; }
        button { background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
        button:hover { background: #059669; }
        .error { color: #f87171; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>تحميل الفيديوهات</h2>
        <form method="POST">
            <input type="text" name="url" placeholder="حط رابط الفيديو هنا..." required>
            <br>
            <button type="submit">تحميل</button>
        </form>
        {% if error %}
            <div class="error">{{ error }}</div>
        {% endif %}
    </div>
</body>
</html>
"""

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        url = request.form.get('url')
        try:
            # إعدادات بسيطة لـ yt-dlp لجلب الفيديو
            ydl_opts = {'format': 'best'}
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                video_url = info.get('url', None)
                if video_url:
                    # تحويل المستخدم لرابط الفيديو المباشر أو عرضه
                    return f'''
                    <div style="background:#1e293b; color:#fff; text-align:center; padding-top:50px; font-family:Tahoma;">
                        <h2>تم تجهيز الفيديو بنجاح!</h2>
                        <a href="{video_url}" target="_blank" style="background:#10b981; color:white; padding:12px 25px; text-decoration:none; border-radius:6px; display:inline-block; margin-top:20px;">اضغط هنا لتحميل الفيديو مباشرة</a>
                        <br><br>
                        <a href="/" style="color:#38bdf8;">الرجوع للخلف</a>
                    </div>
                    '''
        except Exception as e:
            return render_template_string(HTML_TEMPLATE, error=f"حدث خطأ أثناء جلب الفيديو: {str(e)}")
            
    return render_template_string(HTML_TEMPLATE)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
