"""
Gera as versões leves dos vídeos do site.
 
Para cada vídeo dentro de  videos/  (mov, mp4, m4v), cria:
  videos/web/NOME.mp4      -> versão otimizada (720p, H.264) usada quando o vídeo é ampliado
  videos/preview/NOME.mp4  -> prévia curta (8 s, sem som, 480 px) que toca dentro do cartão
 
O site já procura esses arquivos sozinho: não precisa mudar nada no HTML.
Se um deles não existir, o site usa o vídeo original (só que mais pesado).
 
Como usar (na pasta do site, onde ficam index.html e a pasta videos):
    python otimizar_videos.py            # só cria o que ainda não existe
    python otimizar_videos.py --forcar   # refaz tudo
 
Precisa do ffmpeg instalado:  https://ffmpeg.org/download.html
(no Windows: winget install ffmpeg)
"""
import subprocess
import sys
from pathlib import Path
 
PASTA = Path("videos")
EXT = {".mov", ".mp4", ".m4v"}
FORCAR = "--forcar" in sys.argv
 
 
def rodar(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("   erro:", r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "desconhecido")
        return False
    return True
 
 
def tamanho(p):
    return f"{p.stat().st_size / 1048576:.1f} MB"
 
 
def main():
    if not PASTA.is_dir():
        sys.exit("Pasta 'videos' não encontrada. Rode o script na pasta do site.")
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    except Exception:
        sys.exit("ffmpeg não encontrado. Instale em https://ffmpeg.org/download.html")
 
    (PASTA / "web").mkdir(exist_ok=True)
    (PASTA / "preview").mkdir(exist_ok=True)
 
    videos = sorted(p for p in PASTA.iterdir() if p.is_file() and p.suffix.lower() in EXT)
    if not videos:
        print("Nenhum vídeo encontrado em videos/.")
        return
 
    for v in videos:
        web = PASTA / "web" / f"{v.stem}.mp4"
        prev = PASTA / "preview" / f"{v.stem}.mp4"
        print(f"\n{v.name}  ({tamanho(v)})")
 
        if FORCAR or not web.exists():
            print("   gerando versão otimizada...")
            ok = rodar([
                "ffmpeg", "-y", "-v", "error", "-i", str(v),
                "-vf", "scale='if(gt(iw,ih),min(1280,iw),min(720,iw))':-2,fps=30",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(web),
            ])
            if ok:
                print(f"   -> {web}  ({tamanho(web)})")
        else:
            print("   versão otimizada já existe (use --forcar para refazer)")
 
        if FORCAR or not prev.exists():
            print("   gerando prévia...")
            ok = rodar([
                "ffmpeg", "-y", "-v", "error", "-t", "8", "-i", str(v), "-an",
                "-vf", "scale='if(gt(iw,ih),min(854,iw),min(480,iw))':-2,fps=24",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-pix_fmt", "yuv420p",
                "-movflags", "+faststart", str(prev),
            ])
            if ok:
                print(f"   -> {prev}  ({tamanho(prev)})")
        else:
            print("   prévia já existe (use --forcar para refazer)")
 
    # aviso sobre capas (posters) pesadas
    capas = Path("media/posters")
    if capas.is_dir():
        pesadas = [p for p in capas.iterdir() if p.suffix.lower() == ".png" and p.stat().st_size > 300_000]
        if pesadas:
            print("\nAtenção: estas capas são PNG pesadas. Salvar como JPG (cerca de 540 px de largura) deixa o site mais leve:")
            for p in pesadas:
                print(f"   {p}  ({tamanho(p)})")
 
    print("\nPronto! Pode apagar os vídeos originais da pasta do site depois de conferir se estão bons "
          "(guarde uma cópia em outro lugar).")
 
 
if __name__ == "__main__":
    main()
 