"""
Fabrique les textures de matières du jeu (src/assets/textures/*.webp).

Chaque texture imite une vraie matière, à partir de sa structure physique :
- kraft.webp  : papier kraft brun (fibres longues orientées, marbrures, petits éclats de bois) ;
- paper.webp  : grain de papier Canson, en calque transparent posé sur n'importe quelle couleur ;
- card.webp   : papier aquarelle épais (bosses du grain à froid, éclairées d'en haut à gauche), en calque ;
- wood.webp   : bois clair des bâtonnets (veines verticales ondulées, fibres, pores) ;
- board.webp  : veinage d'une planche peinte (la scène), en calque ;
- head.webp   : tête rugueuse des bâtonnets (petites bosses), en calque.

Toutes les textures se raccordent sans couture (bruit construit par transformée de Fourier,
fibres redessinées de l'autre côté des bords). Elles sont faites pour un écran de densité 2 :
une tuile de 360 px s'affiche sur 11,25 rem (180 px CSS à la taille de base),
qui grandit avec l'interface sur les très grands écrans.

Usage : python3 scripts/textures.py   (numpy et Pillow requis). Les graines sont fixes :
le résultat est toujours le même.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "src" / "assets" / "textures"
INK = np.array([42, 31, 23], dtype=np.float64)


# --------------------------------------------------------------------------------------------
# Outils
# --------------------------------------------------------------------------------------------


def fourier_noise(h, w, rng, beta=2.0, stretch=(1.0, 1.0), band=None):
    """Bruit raccordable : du bruit blanc filtré en 1/f^beta (étiré par axe, bande facultative)."""
    white = rng.standard_normal((h, w))
    fy = np.fft.fftfreq(h)[:, None] * stretch[0]
    fx = np.fft.fftfreq(w)[None, :] * stretch[1]
    f = np.sqrt(fx**2 + fy**2)
    f[0, 0] = 1.0
    spectrum = np.fft.fft2(white) / f**beta
    if band is not None:
        low, high = band
        spectrum *= (f >= low) & (f <= high)
    spectrum[0, 0] = 0
    out = np.real(np.fft.ifft2(spectrum))
    return out / (np.abs(out).max() + 1e-9)


def draw_fibers(size, rng, count, length, width, value_range, angle_sd=None, angle_mean=0.0, curl=0.25):
    """Fibres courbes en niveaux (−1 sombre … +1 clair), raccordables, lissées par suréchantillonnage."""
    h, w = size
    scale = 3
    canvas = Image.new("F", (w * scale, h * scale), 0.0)
    draw = ImageDraw.Draw(canvas)
    for _ in range(count):
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        angle = rng.normal(angle_mean, angle_sd) if angle_sd is not None else rng.uniform(0, np.pi)
        total = rng.uniform(*length)
        steps = 5
        points = []
        for _s in range(steps + 1):
            points.append((x, y))
            angle += rng.normal(0, curl)
            x += np.cos(angle) * total / steps
            y += np.sin(angle) * total / steps
        value = rng.uniform(*value_range)
        stroke = max(1, int(round(rng.uniform(*width) * scale)))
        for dy in (-h, 0, h):
            for dx in (-w, 0, w):
                pts = [((px + dx) * scale, (py + dy) * scale) for px, py in points]
                draw.line(pts, fill=float(value), width=stroke)
    small = canvas.resize((w, h), Image.LANCZOS)
    return np.asarray(small, dtype=np.float64)


def emboss(height, strength=1.0):
    """Relief éclairé d'en haut à gauche, à partir d'une carte de hauteur raccordable."""
    gx = np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)
    gy = np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)
    return -(gx + gy) * strength


def save_rgb(array, name, quality=82):
    img = Image.fromarray(np.clip(array, 0, 255).astype(np.uint8), "RGB")
    img.save(OUT / name, "WEBP", quality=quality, method=6)


def save_overlay(delta, name, dark_alpha=0.32, light_alpha=0.28, quality=60):
    """Calque transparent : les creux en encre, les reliefs en blanc, posé en mélange normal."""
    d = np.clip(delta, -1, 1)
    h, w = d.shape
    rgba = np.zeros((h, w, 4), dtype=np.float64)
    dark = d < 0
    rgba[dark, :3] = INK
    rgba[dark, 3] = -d[dark] * dark_alpha * 255
    rgba[~dark, :3] = 255
    rgba[~dark, 3] = d[~dark] * light_alpha * 255
    img = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), "RGBA")
    img.save(OUT / name, "WEBP", quality=quality, method=6, alpha_quality=55)


def normalize(a):
    a = a - a.mean()
    return a / (np.abs(a).max() + 1e-9)


# --------------------------------------------------------------------------------------------
# Matières
# --------------------------------------------------------------------------------------------


def kraft():
    rng = np.random.default_rng(11)
    size = 512
    base = np.array([201, 165, 125], dtype=np.float64)
    # Marbrures sans très basses fréquences : sur une zone de 50 px, la teinte moyenne est la même
    # partout, si bien que deux morceaux de kraft décalés (la page et la barre collée en bas)
    # se raccordent sans former de bloc plus clair. L'éclairage d'ensemble vient du vignettage.
    cloud = fourier_noise(size, size, rng, beta=2.2, band=(0.012, 0.5))
    cloud_fine = fourier_noise(size, size, rng, beta=1.4, band=(0.012, 0.5))
    # Floculation : la pâte se dépose en petits amas de 2 à 6 px, c'est le grain propre au kraft.
    flocs = fourier_noise(size, size, rng, beta=0.8, band=(0.05, 0.3))
    tint = fourier_noise(size, size, rng, beta=2.6, band=(0.012, 0.5))
    # Fibres longues, couchées dans le sens de fabrication (presque horizontales).
    fibers = draw_fibers((size, size), rng, 3400, (6, 30), (0.5, 1.2), (-1, 1), angle_sd=0.5, curl=0.22)
    flecks = draw_fibers((size, size), rng, 90, (1.5, 5), (1.0, 2.2), (-1, -0.6), curl=0.6)
    grain = rng.standard_normal((size, size))
    light = 0.04 * cloud + 0.025 * cloud_fine + 0.05 * normalize(flocs) + 0.075 * fibers + 0.12 * flecks + 0.015 * grain
    rgb = base[None, None, :] * (1 + light[..., None])
    # Teinte qui dérive un peu, du plus jaune au plus rouge, comme une vraie feuille.
    rgb[..., 0] += tint * 4
    rgb[..., 2] -= tint * 5
    rgb -= rgb.reshape(-1, 3).mean(axis=0) - base  # garde la couleur moyenne de la palette
    save_rgb(rgb, "kraft.webp", quality=88)


def paper():
    rng = np.random.default_rng(23)
    size = 360
    cloud = fourier_noise(size, size, rng, beta=2.0)
    felt = draw_fibers((size, size), rng, 3200, (4, 16), (0.4, 1.0), (-1, 1), curl=0.35)
    pores = fourier_noise(size, size, rng, beta=0.6, band=(0.12, 0.5))
    delta = 0.35 * cloud + 0.55 * felt + 0.25 * pores
    save_overlay(normalize(delta), "paper.webp", dark_alpha=0.22, light_alpha=0.26)


def card():
    rng = np.random.default_rng(37)
    size = 360
    # Grain à froid : bosses de 3 à 8 px, éclairées en rasant.
    bumps = fourier_noise(size, size, rng, beta=1.2, band=(0.02, 0.16))
    relief = emboss(bumps, strength=3.2)
    felt = draw_fibers((size, size), rng, 1400, (3, 12), (0.4, 0.9), (-1, 1), curl=0.4)
    cloud = fourier_noise(size, size, rng, beta=2.2)
    delta = 0.7 * normalize(relief) + 0.25 * felt + 0.2 * cloud
    save_overlay(normalize(delta), "card.webp", dark_alpha=0.2, light_alpha=0.36)


def wood():
    rng = np.random.default_rng(41)
    h, w = 1024, 96
    base = np.array([226, 198, 150], dtype=np.float64)
    y, x = np.mgrid[0:h, 0:w].astype(np.float64)
    # Veines verticales : des cernes qui ondulent doucement le long du bâtonnet.
    warp = fourier_noise(h, w, rng, beta=2.4, stretch=(12.0, 1.0)) * 7
    uneven = fourier_noise(h, w, rng, beta=2.8) * 0.9
    period = w / 8  # 8 cernes par tuile : le motif se raccorde
    phase = 2 * np.pi * (x + warp) / period + uneven
    rings = np.sin(phase + 0.6 * np.sin(phase))  # cernes asymétriques, comme le vrai bois
    rings = np.sign(rings) * np.abs(rings) ** 0.7
    fibers = fourier_noise(h, w, rng, beta=1.1, stretch=(24.0, 1.0))
    streak = fourier_noise(h, w, rng, beta=2.0, stretch=(10.0, 1.0))
    pores = draw_fibers((h, w), rng, 700, (2, 7), (0.6, 1.1), (-1, -0.5), angle_sd=0.05, angle_mean=np.pi / 2, curl=0.02)
    light = 0.06 * rings + 0.05 * fibers + 0.05 * streak + 0.1 * pores
    rgb = base[None, None, :] * (1 + light[..., None])
    rgb[..., 2] -= (rings < 0) * 6  # le bois d'été, plus foncé, tire sur le brun
    save_rgb(rgb, "wood.webp", quality=90)


def board():
    rng = np.random.default_rng(53)
    h, w = 256, 1024
    y, x = np.mgrid[0:h, 0:w].astype(np.float64)
    # Les cernes ondulent lentement sur la longueur de la planche, avec des écarts irréguliers.
    warp = fourier_noise(h, w, rng, beta=2.8, stretch=(1.0, 5.0)) * 30
    uneven = fourier_noise(h, w, rng, beta=3.0, stretch=(1.0, 3.0)) * 2.6
    period = h / 9  # 9 cernes par tuile : le motif se raccorde
    phase = 2 * np.pi * (y + warp) / period + uneven
    # Le bois d'été forme une ligne fine et dure : c'est elle qui ressort sous la peinture.
    frac = np.mod(phase / (2 * np.pi), 1.0)
    latewood = np.exp(-((np.minimum(frac, 1 - frac)) / 0.11) ** 2)
    rings = latewood * 2 - 1
    fibers = fourier_noise(h, w, rng, beta=1.0, stretch=(1.0, 28.0))
    height = 0.75 * latewood + 0.25 * fibers
    relief = normalize(emboss(height, 1.0))
    # Coups de pinceau dans le sens du bois : la peinture couvre plus ou moins.
    brush = fourier_noise(h, w, rng, beta=1.6, stretch=(1.0, 9.0))
    delta = 0.5 * relief + 0.14 * rings + 0.36 * brush
    save_overlay(normalize(delta), "board.webp", dark_alpha=0.22, light_alpha=0.18)


def head():
    rng = np.random.default_rng(67)
    size = 128
    bumps = fourier_noise(size, size, rng, beta=0.9, band=(0.06, 0.4))
    delta = 0.8 * normalize(emboss(bumps, 2.4)) + 0.3 * rng.standard_normal((size, size)) * 0.3
    save_overlay(normalize(delta), "head.webp", dark_alpha=0.3, light_alpha=0.3)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for make in (kraft, paper, card, wood, board, head):
        make()
        print("ok", make.__name__)
