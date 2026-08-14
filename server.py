from flask import Flask, render_template, request, send_file, jsonify
import yt_dlp
import os

app = Flask(__name__, template_folder='src', static_folder='src')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/download')
def download_video():
    url = request.args.get('url')
    resolution = request.args.get('resolution', '720p')
    
    # تحديد صيغة التحميل بناء على الجودة المختارة
    format_map = {
        '4k': 'bestvideo[height<=2160]+bestaudio/best[height<=2160]',
        '2k': 'bestvideo[height<=1440]+bestaudio/best[height<=1440]',
        '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
        '720p': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
        '480p': 'bestvideo[height<=480]+bestaudio/best[height<=480]',
        '360p': 'bestvideo[height<=360]+bestaudio/best[height<=360]',
        'audio': 'bestaudio/best'
    }
    
    ydl_opts = {
        'format': format_map.get(resolution, 'best'),
        'outtmpl': 'downloads/%(title)s.%(ext)s',
    }
    
    os.makedirs('downloads', exist_ok=True)
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        if resolution == 'audio':
            filename = os.path.splitext(filename)[0] + '.mp3'
            
    return send_file(filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000)